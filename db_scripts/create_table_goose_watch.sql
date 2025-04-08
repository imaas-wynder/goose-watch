CREATE TABLE `imservicesdb`.`goose_watch` (
    `record_id` int NOT NULL AUTO_INCREMENT COMMENT 'Auto Generated Id',
    `sighting_datetime` datetime NOT NULL COMMENT 'Sighting Date and Time',
    `location` varchar(45) NOT NULL COMMENT 'Sighting Location',
    `location_type` varchar(45) NOT NULL COMMENT 'Sighting Location Type',
    `num_of_geese` tinyint NOT NULL COMMENT 'Number of Geese Sighted',
    `behavior_observed` varchar(45) NOT NULL COMMENT 'Geese Behavior Observed',
    `person_name` varchar(45) DEFAULT NULL COMMENT 'Reporting Person Name',
    `person_email` varchar(45) DEFAULT NULL COMMENT 'Reporting Person Email',
    `person_phone` varchar(45) DEFAULT NULL COMMENT 'Reporting Person Phone Number',
    `assist_required` varchar(1) DEFAULT NULL COMMENT 'Assistance Required by Reporting Person',
    `file_metadata` varchar(45) DEFAULT NULL COMMENT 'Image Metadata reference',
    PRIMARY KEY (`record_id`)
)
ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Table contains Goose Watch data';