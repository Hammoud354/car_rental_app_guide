import { relations } from "drizzle-orm";
import { users, vehicles } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
}));
