-- CreateTable
CREATE TABLE "World" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vrchatWorldId" TEXT,
    "name" TEXT NOT NULL,
    "authorName" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "userMemo" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorldOnGroup" (
    "worldId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    PRIMARY KEY ("worldId", "groupId"),
    CONSTRAINT "WorldOnGroup_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldOnGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "World_vrchatWorldId_key" ON "World"("vrchatWorldId");
