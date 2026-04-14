ALTER TABLE "service_orders" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "service_orders_shareToken_key" ON "service_orders"("shareToken");
