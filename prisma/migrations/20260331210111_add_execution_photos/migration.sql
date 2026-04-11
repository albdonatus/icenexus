-- CreateTable
CREATE TABLE "execution_photos" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "execution_photos" ADD CONSTRAINT "execution_photos_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "action_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
