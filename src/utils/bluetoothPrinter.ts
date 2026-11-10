// Bluetooth ESC/POS Thermal Printer Utility

export interface BluetoothDeviceState {
  connected: boolean;
  name?: string;
  error?: string;
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateEscPosCommands(
  storeName: string,
  storeAddress: string,
  storePhone: string,
  invoiceNo: string,
  cashierName: string,
  customerName: string | undefined,
  dateStr: string,
  items: { productName: string; quantity: number; price: number; subtotal: number }[],
  subtotal: number,
  discount: number,
  total: number,
  paymentMethod: string,
  cashPaid: number,
  change: number,
  footerNote: string
): Uint8Array {
  const enc = new TextEncoder();
  let buffer = '';

  // Initialize printer
  buffer += ESC + '@';
  // Center alignment
  buffer += ESC + 'a' + '\x01';
  // Double height & width for title
  buffer += ESC + '!' + '\x30';
  buffer += storeName + '\n';
  // Normal text
  buffer += ESC + '!' + '\x00';
  buffer += storeAddress + '\n';
  buffer += 'Telp: ' + storePhone + '\n';
  buffer += '--------------------------------\n';

  // Left alignment
  buffer += ESC + 'a' + '\x00';
  buffer += `No. Trx : ${invoiceNo}\n`;
  buffer += `Kasir   : ${cashierName}\n`;
  if (customerName) {
    buffer += `Pelanggan: ${customerName}\n`;
  }
  buffer += `Waktu   : ${dateStr}\n`;
  buffer += '--------------------------------\n';

  // Items
  items.forEach((item) => {
    buffer += `${item.productName}\n`;
    const qtyPrice = `  ${item.quantity} x ${formatCurrency(item.price)}`;
    const sub = formatCurrency(item.subtotal);
    const spaceCount = Math.max(1, 32 - qtyPrice.length - sub.length);
    buffer += qtyPrice + ' '.repeat(spaceCount) + sub + '\n';
  });

  buffer += '--------------------------------\n';
  // Totals
  const subtotalStr = formatCurrency(subtotal);
  const totalStr = formatCurrency(total);
  const payStr = formatCurrency(cashPaid);
  const changeStr = formatCurrency(change);

  const padLine = (label: string, val: string) => {
    const space = Math.max(1, 32 - label.length - val.length);
    return label + ' '.repeat(space) + val + '\n';
  };

  buffer += padLine('Subtotal', subtotalStr);
  if (discount > 0) {
    buffer += padLine('Diskon', '-' + formatCurrency(discount));
  }
  buffer += ESC + '!' + '\x20'; // Bold
  buffer += padLine('TOTAL', totalStr);
  buffer += ESC + '!' + '\x00'; // Normal

  buffer += padLine(`Bayar (${paymentMethod.toUpperCase()})`, payStr);
  if (change > 0) {
    buffer += padLine('Kembalian', changeStr);
  }

  buffer += '--------------------------------\n';
  // Center alignment
  buffer += ESC + 'a' + '\x01';
  buffer += `${footerNote}\n`;
  buffer += 'Powered by SnackPOS Pro\n';
  buffer += '\n\n\n';
  // Cut paper command
  buffer += GS + 'V' + '\x41' + '\x00';

  return enc.encode(buffer);
}

class BluetoothThermalPrinter {
  private device: any = null;
  private characteristic: any = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public async connect(): Promise<{ success: boolean; name?: string; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Browser ini belum mendukung Web Bluetooth API. Gunakan Chrome di Android/Desktop.',
      };
    }

    try {
      const nav = navigator as any;
      // Request standard thermal bluetooth printer services or generic access
      this.device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent
          0xffe0, // HM-10
          0x18f0,
        ],
      });

      if (!this.device) {
        return { success: false, message: 'Tidak ada printer yang dipilih.' };
      }

      const server = await this.device.gatt.connect();
      const services = await server.getPrimaryServices();

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            this.characteristic = c;
            break;
          }
        }
        if (this.characteristic) break;
      }

      return {
        success: true,
        name: this.device.name || 'Printer Bluetooth POS',
        message: 'Berhasil terhubung ke printer!',
      };
    } catch (err: any) {
      console.warn('Bluetooth connection cancelled or error:', err);
      return {
        success: false,
        message: err.message || 'Gagal menyambungkan Bluetooth.',
      };
    }
  }

  public async printData(rawBytes: Uint8Array): Promise<{ success: boolean; message: string }> {
    if (!this.characteristic) {
      return {
        success: false,
        message: 'Printer Bluetooth belum terhubung. Silakan hubungkan terlebih dahulu.',
      };
    }

    try {
      // Send chunks of 100 bytes to prevent buffer overflow on mobile thermal printers
      const chunkSize = 100;
      for (let i = 0; i < rawBytes.length; i += chunkSize) {
        const chunk = rawBytes.slice(i, i + chunkSize);
        if (this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
      }
      return { success: true, message: 'Struk berhasil dicetak via Bluetooth!' };
    } catch (err: any) {
      return { success: false, message: 'Gagal mengirim data ke printer: ' + err.message };
    }
  }
}

export const btPrinter = new BluetoothThermalPrinter();
