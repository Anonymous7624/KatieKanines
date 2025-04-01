import { pgTable, text, serial, integer, date, time, uuid, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema - for all user types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // 'admin', 'client', or 'walker'
  isActive: boolean("is_active").default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true,
});

// Client schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  notes: text("notes"),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0"),
  lastPaymentDate: date("last_payment_date"),
  stripeCustomerId: text("stripe_customer_id"), // For Stripe integration
  stripeSubscriptionId: text("stripe_subscription_id"), // For Stripe subscription billing
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

// Walker schema
export const walkers = pgTable("walkers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bio: text("bio"),
  availability: text("availability"), // JSON string of availability
  rating: integer("rating"),
  rate20Min: numeric("rate_20_min", { precision: 10, scale: 2 }).default("15.00"), // Rate for 20 min walks
  rate30Min: numeric("rate_30_min", { precision: 10, scale: 2 }).default("20.00"), // Rate for 30 min walks
  rate60Min: numeric("rate_60_min", { precision: 10, scale: 2 }).default("35.00"), // Rate for 60 min walks
  rateOvernight: numeric("rate_overnight", { precision: 10, scale: 2 }).default("80.00"), // Rate for overnight stays
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).default("0.00"), // Total earnings to date
  unpaidEarnings: numeric("unpaid_earnings", { precision: 10, scale: 2 }).default("0.00"), // Current unpaid balance
  street: text("street"), // Street address
  city: text("city"), // City
  state: text("state"), // State
  zip: text("zip"), // Zip code
  color: text("color").default("#4f46e5"), // Color for this walker in schedule views
});

export const insertWalkerSchema = createInsertSchema(walkers).omit({
  id: true,
  rating: true,
  totalEarnings: true,
  unpaidEarnings: true,
});

// Pet schema
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  breed: text("breed"),
  age: integer("age"),
  size: text("size"), // 'small', 'medium', 'large'
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
});

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  isActive: true,
});

// Walk schema
export const walks = pgTable("walks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  walkerId: integer("walker_id"),
  petId: integer("pet_id").notNull(), // Primary pet (for backward compatibility)
  allPetIds: text("all_pet_ids"), // Comma-separated list of pet IDs for multiple pets
  date: date("date").notNull(),
  time: time("time").notNull(),
  duration: integer("duration").default(30), // in minutes, or 'overnight'
  billingAmount: numeric("billing_amount", { precision: 10, scale: 2 }), // Dollar amount for billing
  isPaid: boolean("is_paid").default(false), // Track if this specific walk has been paid
  paidDate: date("paid_date"), // Date when the walk was paid
  status: text("status").default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  notes: text("notes"),
  isGroupWalk: boolean("is_group_walk").default(false),
  repeatWeekly: boolean("repeat_weekly").default(false), // New field for repeat weekly option
  recurringGroupId: text("recurring_group_id"), // To group recurring walks
  numberOfWeeks: integer("number_of_weeks"), // Number of weeks to repeat a walk
  isBalanceApplied: boolean("is_balance_applied").default(false), // Track if the walk has been applied to client balance
  stripePaymentIntentId: text("stripe_payment_intent_id"), // For Stripe integration
});

// We need to extend the schema with custom validation to handle the overnight case
export const insertWalkSchema = createInsertSchema(walks).omit({
  id: true,
  status: true,
  isBalanceApplied: true,
}).extend({
  // Allow the duration to be either a number or the string 'overnight'
  duration: z.union([z.number(), z.literal('overnight')]),
  // Make billing amount optional with validation
  billingAmount: z.number().min(0).optional(),
  // Repeat weekly option
  repeatWeekly: z.boolean().optional().default(false),
  // Number of weeks to repeat (only used when repeatWeekly is true)
  numberOfWeeks: z.union([z.number().min(1).max(52), z.null()]).optional(),
  // Recurring group ID - generated by backend
  recurringGroupId: z.string().optional()
});

// Walk Photo schema
export const walkPhotos = pgTable("walk_photos", {
  id: serial("id").primaryKey(),
  walkId: integer("walk_id").notNull(),
  photoUrl: text("photo_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertWalkPhotoSchema = createInsertSchema(walkPhotos).omit({
  id: true,
  uploadedAt: true,
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  isRead: true,
});

// Walker payments schema
export const walkerPayments = pgTable("walker_payments", {
  id: serial("id").primaryKey(),
  walkerId: integer("walker_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").default("cash"), // cash, check, transfer, etc.
  notes: text("notes"),
});

export const insertWalkerPaymentSchema = createInsertSchema(walkerPayments).omit({
  id: true,
});

// Walker earnings schema
export const walkerEarnings = pgTable("walker_earnings", {
  id: serial("id").primaryKey(),
  walkerId: integer("walker_id").notNull(),
  walkId: integer("walk_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  earnedDate: date("earned_date").notNull(),
  isPaid: boolean("is_paid").default(false),
  paymentId: integer("payment_id"), // References the walker_payments table when paid
});

export const insertWalkerEarningSchema = createInsertSchema(walkerEarnings).omit({
  id: true,
  isPaid: true,
  paymentId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Walker = typeof walkers.$inferSelect;
export type InsertWalker = z.infer<typeof insertWalkerSchema>;

export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;

export type Walk = typeof walks.$inferSelect;
export type InsertWalk = z.infer<typeof insertWalkSchema>;

export type WalkPhoto = typeof walkPhotos.$inferSelect;
export type InsertWalkPhoto = z.infer<typeof insertWalkPhotoSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type WalkerPayment = typeof walkerPayments.$inferSelect;
export type InsertWalkerPayment = z.infer<typeof insertWalkerPaymentSchema>;

export type WalkerEarning = typeof walkerEarnings.$inferSelect;
export type InsertWalkerEarning = z.infer<typeof insertWalkerEarningSchema>;

// Extended schemas with relationships
export const userWithRoleSchema = z.object({
  ...insertUserSchema.shape,
  id: z.number(),
  isActive: z.boolean(),
  clientDetails: z.object({
    id: z.number(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    notes: z.string().optional(),
    balance: z.number().default(0),
    lastPaymentDate: z.string().nullable().optional(),
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
  }).optional(),
  walkerDetails: z.object({
    id: z.number(),
    bio: z.string().optional(),
    availability: z.string().optional(),
    rating: z.number().optional(),
    rate20Min: z.number().optional().default(15),
    rate30Min: z.number().optional().default(20),
    rate60Min: z.number().optional().default(35),
    rateOvernight: z.number().optional().default(80),
    totalEarnings: z.number().optional().default(0),
    unpaidEarnings: z.number().optional().default(0),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    color: z.string().optional().default("#4f46e5"),
  }).optional(),
});

export type UserWithRole = z.infer<typeof userWithRoleSchema>;

export const walkWithDetailsSchema = z.object({
  ...insertWalkSchema.shape,
  id: z.number(),
  status: z.string(),
  clientName: z.string(),
  petName: z.string(), // Primary pet name for backward compatibility
  allPetNames: z.string().optional(), // Comma-separated list of all pet names
  allPetIds: z.string().optional(), // Comma-separated list of all pet IDs
  walkerName: z.string().optional(),
  isPaid: z.boolean().default(false),
  paidDate: z.string().nullable().optional(),
  isBalanceApplied: z.boolean().optional().default(false),
  repeatWeekly: z.boolean().optional().default(false),
  numberOfWeeks: z.union([z.number().min(1).max(52), z.null()]).optional(),
  recurringGroupId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(), // For Stripe integration
});

export type WalkWithDetails = z.infer<typeof walkWithDetailsSchema>;

export const clientWithPetsSchema = z.object({
  ...userWithRoleSchema.shape,
  pets: z.array(z.object({
    id: z.number(),
    name: z.string(),
    breed: z.string().optional(),
    age: z.number().optional(),
    size: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean()
  }))
});

export type ClientWithPets = z.infer<typeof clientWithPetsSchema>;

// Earnings with details for display
export const walkerEarningWithDetailsSchema = z.object({
  id: z.number(),
  walkerId: z.number(),
  walkId: z.number(),
  amount: z.number(),
  earnedDate: z.string(),
  isPaid: z.boolean().default(false),
  paymentId: z.number().optional(),
  // Additional fields for display
  walkDate: z.string(),
  walkTime: z.string(),
  walkDuration: z.union([z.number(), z.string()]),
  clientName: z.string(),
  petName: z.string(),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentAmount: z.number().optional(),
});

export type WalkerEarningWithDetails = z.infer<typeof walkerEarningWithDetailsSchema>;
