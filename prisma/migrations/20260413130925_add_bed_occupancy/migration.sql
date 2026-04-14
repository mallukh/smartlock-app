-- CreateTable
CREATE TABLE "BedSensor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomNumber" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 0,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BedSensor_roomNumber_fkey" FOREIGN KEY ("roomNumber") REFERENCES "Room" ("number") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BedLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomNumber" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "isOccupied" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "BedSensor_roomNumber_key" ON "BedSensor"("roomNumber");
