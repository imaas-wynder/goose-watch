import mysql from 'mysql2';
import {properties} from './properties';
import { useState } from 'react';

function AppServer(props) {

  const data = props.data;

  const requestType           = data["request_type"];
  const sightingDatetime      = data["sighting_datetime"];
  const location              = data["location"];
  var locationType            = data["location_type"];
  const locationTypeOther     = data["location_type_other"] || null;
  const numOfGeese            = data["num_of_geese"];
  var behaviorObserved        = data["behavior_observed"];
  const behaviorObservedOther = data["behavior_observed_other"] || null;
  const personName            = data["person_name"] || null;
  const personEmail           = data["person_email"] || null;
  const personPhone           = data["person_phone"] || null;
  const assistRequired        = data["assist_required"] || "N";
  const fileMetadata          = data["file_metadata"] || null;

  if (locationType === "other") locationType = locationTypeOther;
  if (behaviorObserved === "other") behaviorObserved = behaviorObservedOther;

  const insertGooseWatchQuery = "INSERT INTO imservicesdb.goose_watch (sighting_datetime, location, location_type, num_of_geese, behavior_observed, person_name, person_email, person_phone, assist_required, file_metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const selectGooseWatchQuery = "SELECT record_id, sighting_datetime, location, location_type, num_of_geese, behavior_observed, assist_required, file_metadata FROM imservicesdb.goose_watch ORDER BY record_id";

  const [dbResults, setDBResults] = useState("Result not loaded");

  const connection = mysql.createConnection({
    host     : properties.db_host,
    port     : properties.db_port,
    user     : properties.db_user,
    password : properties.db_password,
    database : properties.db_database
  })

  if (requestType === 'form') {

    connection.execute(
      insertGooseWatchQuery,
      [sightingDatetime, location, locationType, numOfGeese, behaviorObserved, personName, personEmail, personPhone, assistRequired, fileMetadata],
      function (error, results) {
        if (error) {
          console.log("error: ", error)
          throw error;
        }

        console.log('New goose watch record added with record Id: ', results.insertId);
      }
    );
 
  }
  else if (requestType === 'report') {
    /*
    connection
      .promise()
      .query(selectGooseWatchQuery)
      .then(async ([rows, fields]) => {
        await setDBResults(rows);
        await console.log('AppServer - dbResults: ', dbResults);
      })
      .catch(console.log)
      //.then(() => conn.end());
    */
  }

  return (dbResults);
}

export default AppServer;