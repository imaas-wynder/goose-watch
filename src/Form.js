import { useState, useEffect, useRef } from 'react';
//import { Link } from 'react-router-dom';
import axios from 'axios';
import {properties} from './properties';

function Form() {
    const [accessToken, setAccessToken] = useState();
    const [inputs, setInputs] = useState({
      request_type: "form",
      sighting_datetime: "",
      location: "",
      location_type: "",
      num_of_geese: "",
      behavior_observed: "",
      person_name: "",
      person_email: "",
      person_phone: "",
      assist_required: "N",
      location_type_other: "",
      behavior_observed_other: ""
    });
    const [showLocationTypeOther, setShowLocationTypeOther] = useState(false);
    const [showBehaviorObservedOther, setShowBehaviorObservedOther] = useState(false);
    const [file, setFile] = useState();                 //reference to file uploaded from the UI
    const [folderId, setFolderId] = useState("");         //reference to folder metadata
  
    const isLoaded = useRef(false);
  
    useEffect(() => {
      if (!isLoaded.current)
        initialize();
  
      isLoaded.current = true;
    }, []);
  
    /**
     * initialize() - Get Access token and create a folder (if not already created) for images uploaded through the form
     */
    async function initialize() {
      console.log('Initializing App instance');
      //-- Get Access Token
      const url = `${properties.base_url}/tenants/${properties.tenant_id}/oauth2/token`
      const requestOptions = {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
              client_id: properties.client_id,
              client_secret: properties.client_secret,
              grant_type: "password",
              username: properties.username,
              password: properties.password
          })
      }
  
      const response = await fetch(url, requestOptions)
      if (!response.ok) {
        alert("Authentication Failed. Please verify your credentials in properties.js")
        return
      }
      const data = await response.json()
      const token = data.access_token;
      setAccessToken(token)
      //--
  
      //-- Get folder Id to store images in Content Storage by calling Content Metadata Service
      const url1 = `${properties.base_url}/cms/instances/folder/cms_folder?include-total=true&filter=name%20eq%20%27${properties.cms_folder}%27`
      const fetchOptions1 = {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': "application/hal+json"
        }
      }
  
      const response1 = await fetch(url1, fetchOptions1);
      const data1     = await response1.json();
      if (data1.total > 0) {
        let folder = data1._embedded.collection[0].id;
        setFolderId(folder);
      }
      else { 
        //Did not find the folder in CMS, create a new one using Content Metadata Service
        const url2 = `${properties.base_url}/cms/instances/folder/cms_folder`
        const fetchOptions2 = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json', 
              'accept': 'application/hal+json'
            },
            body: JSON.stringify({
              "name": properties.cms_folder,
              "display_name": properties.cms_folder,
              "description": "Folder to store Goose Watch images",
              "type": "cms_folder"
            })
        }
    
        const response2 = await fetch(url2, fetchOptions2);
        const data2     = await response2.json();
        let folder = data2.id;
        setFolderId(data2.id);
        console.log('CMS Folder Created: ', folder)
      }
      //--
    }
  
    /**
     * handleFileUpload() - Handles image file selected by user
     */
    function handleFileUpload(event) {
      console.log('handleFileUpload - event.target.name: ', event.target.name);
      setFile(event.target.files[0]);
    }
  
    /**
     * uploadFileToCSS() - Upload File to Content Storage by calling Content Storage Service
     */
    async function uploadFileToCSS() {
      const cssUrl =`${properties.css_url}/v2/tenant/${properties.tenant_id}/content`
      const cssFetchOptions = {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': "application/hal+json",
          'Content-Type': file.type,
          'Content-Length': file.size 
        },
        body: file
      }
  
      
      const response = await fetch(cssUrl, cssFetchOptions);
      const data     = await response.json();
      const cssFile  = await data.entries[0];
  
      return cssFile;
    }
  
    /**
     * createUniqueFileName() - create a unique file name (using location and timestamp) to avoid duplicate image file names
     */
    function createUniqueFileName(fileName) {
      const fname = fileName.substring(0,fileName.lastIndexOf('.'));
      const fext = fileName.substring(fileName.lastIndexOf('.'));
      const newFileName = fname.concat('-',inputs.location,'-',(new Date()).toISOString(),fext);
  
      return newFileName;
    }
  
    /**
     * createMetadataForFile() - Create metadata for the image file by calling Content Metadata Service
     */
    async function createMetadataForFile(uploadedFile) {
  
      const newFileName = createUniqueFileName(file.name);
  
      //Now create metadata   
      const url = `${properties.base_url}/cms/instances/file/cms_file`
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/hal+json',
          'Content-Type': 'application/hal+json' 
        },
        body: JSON.stringify({
          "name": newFileName,
          "description": "Image uploaded for Goose Watch",
          "parent_folder_id": folderId,
          "renditions": [{
              "name": newFileName,
              "rendition_type": "primary",
              "blob_id": uploadedFile.id,
              "mime_type": uploadedFile.mimeType
            }]
        })
      }
  
      const response = await fetch(url, fetchOptions);
      const data     = await response.json();
  
      return data;
    }
  
    /**
     * sendMessageForAssistance() - Use Messaging API to email for assistance
     */
    function sendMessageForAssistance() {

        const url = `${properties.messaging_url}/mra/v1/outbound/emails`;

        let message = `\n${inputs.person_name} is requesting assistance for the following situation:\n\n`+
                      `Date & Time of Geese Sighting: ${new Date(inputs.sighting_datetime).toLocaleString()}\n`+ 
                      `Location: ${inputs.location}\n`+
                      `Location Type: ${(inputs.location_type!=='other')?inputs.location_type:inputs.location_type_other}\n`+
                      `Number of Geese: ${inputs.num_of_geese}\n`+
                      `Behaviour Observed: ${(inputs.behavior_observed!=='other')?inputs.behavior_observed:inputs.behavior_observed_other}\n\n`+
                      `${inputs.person_name}'s Email: ${inputs.person_email}\n`+
                      `${inputs.person_name}'s Phone Number: ${inputs.person_phone}\n\n`+
                      `Thank you,\nGoose Watch\n`;

        let encoded_message = window.btoa(message);

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "options": {
                    "email_options": {
                        "subject": "Goose Watch Assistance Requested"
                    }
                },
                "destinations": [
                    {
                        "ref": "1",
                        "email": properties.email_for_assistance
                    }
                ],
                "body": [
                    {
                        "name": "temp.txt",
                        "type": "text",
                        "charset": "ISO-8859-1",
                        "data": encoded_message
                    }
                ]
            })
        }

        fetch(url, fetchOptions)
        .then(response => response.json())
        .then(data => {
            const jobId = data.job_id;
            console.log("Messaging Email Job Id: ", jobId);
        })
        .catch(error => {
            console.error("Error sending email for assistance: ", error);
        })
    }

    /**
     * sendToDBServer() - Insert record into database by calling the Server-side React App
     */
    function sendToDBServer(dbInputs) {
      //console.log('sendToDBServer - dbInputs: ', dbInputs);
      const url = properties.server_url
      axios.post(url, dbInputs)
      .then(res => {
        console.log('sendToDBServer - response: ', res);
        alert('Information submitted successfully');
        resetForm();
        })
      .catch(error => {
        console.log('sendToDBServer - error: ', error.message);
        alert('Error: Unable to add data into database')
      })
    }
    
    /**
     * analyzeImageWithInfoIntel() - Determine risk level of uploaded image using Information Intelligence API. 
     */
    async function analyzeImageWithInfoIntel() {
    
      let formData = new FormData();
      formData.append('File', file, file.name);
  
      let options = {
        url: `${properties.infointel_url}/api/v1/classify`,
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`, 
          'Accept': "application/json",
          'Content-Type': "multipart/form-data"
        },
        data: formData
      }
  
      const response = await axios(options);
      const data = response.data;
      const riskLevel = data.riskClassification.result.image[0].riskLevel
      console.log('InfoIntel - riskLevel: ', riskLevel);
  
      return riskLevel;  
    }
  
    /**
     * handleChange() - Adds field values into inputs object that is later sent to AppServer to insert data into database
     */
    function handleChange(event) {
  
      var name = event.target.name;
      var value = event.target.value;
  
      setInputs(values => ({...values, [name]: value}));
  
      if (name==='location_type') { 
        if (value==='other') setShowLocationTypeOther(true);
        else if (showLocationTypeOther) setShowLocationTypeOther(false);
      }
      else if (name==='behavior_observed') {
        if (value==='other') setShowBehaviorObservedOther(true);
        else if (showBehaviorObservedOther) setShowBehaviorObservedOther(false);
      }
    }
  
    function resetForm() {
      //console.log('resetForm');
      document.getElementById("goosewatchform").reset();
      setInputs({
        request_type: "form",
        sighting_datetime: "",
        location: "",
        location_type: "",
        num_of_geese: "",
        behavior_observed: "",
        person_name: "",
        person_email: "",
        person_phone: "",
        assist_required: "N",
        location_type_other: "",
        behavior_observed_other: ""
      });
      setFile(null);
      setShowLocationTypeOther(false);
      setShowBehaviorObservedOther(false);
    }
  
    /**
     * handleSubmit() - Handles the form submission
     */
    async function handleSubmit(event) {
      event.preventDefault();
  
      console.log('handleSubmit - inputs: ', inputs);
  
      //Check for mandatory fields
      if (!inputs.sighting_datetime || !inputs.location.trim() || !inputs.location_type || !inputs.num_of_geese || !inputs.behavior_observed 
        || ((inputs.location_type === "other") && !inputs.location_type_other.trim())
        || ((inputs.behavior_observed === "other") && !inputs.behavior_observed_other.trim()))
      {
        alert('Please complete the required fields');
        return;
      }

      if ((inputs.assist_required === "Y") && !(inputs.person_name || inputs.person_email || inputs.person_phone)) {
        alert('For assistance please provide your name, email and phone number');
        return;
      }

      //If user requires assistance send email using Messaging Service...
      if (inputs.assist_required === "Y")
        sendMessageForAssistance();
  
      //If user selected an image file to upload...
      if (file) {
        //TODO: Check if auth token has expired. When token is expired, you get 401 (Unauthorized) status with faultstring:"Access Token expired"
  
        //Analyze image with Information Intelligence API
        let riskLevel = await analyzeImageWithInfoIntel();
        if (riskLevel !== 'noRisk') {
          console.log('handleSubmit - analyzeImageWithInfoIntel: ', riskLevel);
          alert('Error: Uploaded image has a '+riskLevel+' risk score and is not allowed.');
          return;
        }
    
        //Upload image file to Content Storage
        let cssUploadedFile = await uploadFileToCSS();
        console.log('handleSubmit - cssUploadedFile: ', cssUploadedFile);
  
        if (!cssUploadedFile) {
          alert('Error: Unable to upload file to Content Storage. Please check logs for details.')
          return;
        }
  
        //Create image file metadata
        let fileMetadata = await createMetadataForFile(cssUploadedFile);
        console.log('handleSubmit - fileMetadata: ', fileMetadata);
  
        //Add image file metadata id to the input list to add to the database record
        const dbInputs = {...inputs, "file_metadata": fileMetadata.id};
        sendToDBServer(dbInputs);
      }
      else {
        sendToDBServer(inputs);
      }
    }
  
    /***********************
     * Render page
     **********************/
    return (
      <main>
        <img src="goose-watch-logo.jpg" alt="Flowers in Chania" width="500" height="224"></img>
        <br/><br />
        <div className="ot2-body">
        <form method="post" id="goosewatchform" onSubmit={handleSubmit}>
          <label className="requiredlabel" htmlFor="sighting_datetime">Date/Time of Sighting:</label>
          <input type="datetime-local" id="sighting_datetime" name="sighting_datetime" onChange={handleChange} value={inputs.sighting_datetime} required />
          <br/><br/>
          <label className="requiredlabel" htmlFor="location">Location:</label>
          <input type="text" id="location" name="location" onChange={handleChange} value={inputs.location} required />
          <br/><br/>
          <label className="requiredlabel" htmlFor="location_type">Location Type:</label>
          <select name="location_type" id="location_type" onChange={handleChange} value={inputs.location_type} required>
            <option value="">(Please select)</option>
            <option value="Park">Park</option>
            <option value="Pond">Pond</option>
            <option value="Street">Street</option>
            <option value="Sidewalk">Sidewalk</option>
            <option value="Parking Lot">Parking Lot</option>
            <option value="Building Entrance">Building Entrance</option>
            <option value="other">Other (Please Specify)</option>
          </select>
          {showLocationTypeOther && <input className="other" type="text" id="location_type_other" name="location_type_other" onChange={handleChange} value={inputs.location_type_other} />}
          
          <br/><br/>
          <label className="requiredlabel" htmlFor="num_of_geese">Number of Geese:</label>
          <input type="number" id="num_of_geese" name="num_of_geese" min="1" max="100" onChange={handleChange} value={inputs.num_of_geese} required />
          <br/><br/>
          <label className="requiredlabel" htmlFor="behavior_observed">Behavior Observed:</label>
          <select name="behavior_observed" id="behavior_observed" onChange={handleChange} value={inputs.behavior_observed} required>
            <option value="">(Please select)</option>
            <option value="Minding own business">Minding their own business</option>
            <option value="Being aggressive">Being aggressive towards humans</option>
            <option value="Occupying large area">Occupying a large area</option>
            <option value="Hindering human activity">Hindering human movement/activity</option>
            <option value="other">Other (Please Specify)</option>
          </select>
          {showBehaviorObservedOther && <input className="other" type="text" id="behavior_observed_other" name="behavior_observed_other" onChange={handleChange} value={inputs.behavior_observed_other} />}
  
          <br/><br/>
          <label htmlFor="upload_file">Upload Image:</label>
          <label className="fileButton" htmlFor="upload_file">Select Image
            <input type="file" id="upload_file" name="upload_file" accept="image/*" onChange={handleFileUpload} />
          </label>
          &nbsp;&nbsp;&nbsp;{file && file.name}
  
          <br/><br/><br/>
          <hr align='left' />
          <br/><br/>
          <label htmlFor="person_name">Reporting Person Name:</label>
          <input type="text" id="person_name" name="person_name" onChange={handleChange} value={inputs.person_name} />
          <br/><br/>
          <label htmlFor="person_email">Email Address:</label>
          <input type="text" id="person_email" name="person_email" onChange={handleChange} value={inputs.person_email} />
          <br/><br/>
          <label htmlFor="person_phone">Phone Number:</label>
          <input type="text" id="person_phone" name="person_phone" onChange={handleChange} value={inputs.person_phone} />
          <br/><br/>
          <label htmlFor="assist_required">Assistance Required:</label>
            <input type="radio" id="assist_required_yes" name="assist_required" value="Y" onChange={handleChange} checked={inputs.assist_required==='Y'} />
            <label htmlFor='assist_required_radio'>Yes</label>
            <input type="radio" id="assist_required_no" name="assist_required" value="N" onChange={handleChange} checked={inputs.assist_required==='N'} />
            <label htmlFor='assist_required_radio'>No</label>
          <br/><br/><br/><br/><br/>
          <button type="submit" onClick={handleSubmit}>Submit</button>
          </form>
          <br/><br/>
        </div>
      </main>
    );
}

export default Form;