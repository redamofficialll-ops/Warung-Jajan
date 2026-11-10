import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  pin: text('pin'), // Optional PIN for auth
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  stock: integer('stock').default(0).notNull(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  totalAmount: integer('total_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
});
