-- -- DROP TABLE IF EXISTS CampusGraph;
-- -- DROP TABLE IF EXISTS NavGraph;
-- -- DROP TABLE IF EXISTS BldgGraph;
-- -- DROP TABLE IF EXISTS DoorCoords;
-- -- DROP TABLE IF EXISTS EdgeTable;

-- CREATE TABLE EdgeTable (
-- bid VARCHAR(30),
-- eid INTEGER,
-- edge VARCHAR(512),
-- lastUpdated TEXT,
-- PRIMARY KEY (bid, eid)
-- );

-- CREATE TABLE BldgGraph (
-- bid VARCHAR(30) PRIMARY KEY NOT NULL, 
-- bldgGraph VARCHAR(512) NOT NULL,
-- lastUpdated TEXT
-- );

-- CREATE TABLE NavGraph (
-- bid VARCHAR(30) NOT NULL,
-- floor INTEGER NOT NULL,
-- bldgGraph VARCHAR(512) NOT NULL,
-- lastUpdated TEXT,
-- PRIMARY KEY(bid, floor)
-- );

-- CREATE TABLE CampusGraph (
-- cid VARCHAR(30) PRIMARY KEY NOT NULL, 
-- campusGraph VARCHAR(512) NOT NULL,
-- lastUpdated TEXT
-- );

-- /*
--  * Table for storing door coordinates,
--  * does not reference bid in the building graph
--  * because it has to be populated prior to the
--  * graphs being calculated.
--  */
-- CREATE TABLE DoorCoords (
-- bid VARCHAR(30) NOT NULL,
-- floor INTEGER NOT NULL,
-- door INTEGER NOT NULL,
-- xCoord INTEGER NOT NULL,
-- yCoord INTEGER NOT NULL,
-- PRIMARY KEY(bid, floor, door)
-- );

-- Populate the DoorCoords table with our data --
-- VALUES (bid, floor, door, xCoord, yCoord) --
Drop Table if EXISTS DoorCoords;
CREATE TABLE DoorCoords (
bid VARCHAR(30) NOT NULL,
floor INTEGER NOT NULL,
door INTEGER NOT NULL,
xCoord INTEGER NOT NULL,
yCoord INTEGER NOT NULL,
PRIMARY KEY(bid, floor, door)
);
INSERT INTO DoorCoords VALUES ('sub', 1, 0, 53.525367, -113.527908);
INSERT INTO DoorCoords VALUES ('sub', 1, 1, 53.524938, -113.527184);
INSERT INTO DoorCoords VALUES ('sub', 1, 2, 53.525427, -113.526755);
INSERT INTO DoorCoords VALUES ('sub', 1, 3, 53.525398, -113.526382);

INSERT INTO DoorCoords VALUES ('ath', 1, 1, 53.526888, -113.526551);
INSERT INTO DoorCoords VALUES ('ath', 1, 0, 53.526535, -113.526551);

INSERT INTO DoorCoords VALUES ('ath', 2, 0, 53.526660, -113.526723);
INSERT INTO DoorCoords VALUES ('ath', 2, 1, 53.526704, -113.526551);

INSERT INTO DoorCoords VALUES ('cab', 1, 0, 53.526714, -113.525000);
INSERT INTO DoorCoords VALUES ('cab', 1, 1, 53.526199, -113.524910);