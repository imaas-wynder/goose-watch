import { useState, useEffect, useRef } from 'react';
//import { Link } from 'react-router-dom';
import api from './common/requestInterceptor';
import {properties} from './properties';
import { ClipLoader } from "react-spinners";

function Form() {
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
    const [folderId, setFolderId] = useState("");       //reference to folder metadata

    const [bootstrapLoader, setBootstrapLoader] = useState(false);
  
    const isLoaded = useRef(false);
  
    useEffect(() => {
      if (!isLoaded.current)
        initialize();
  
      isLoaded.current = true;
    }, []);

    /**
     * initialize() - Initialize the app related configurations
     */
    async function initialize() {
      console.log('Initializing the App configurations');

      //Get the folder
      let url = `/cms/instances/folder/cms_folder?filter=name%20eq%20%27${properties.cms_folder}%27`
      const response = await api.get(url)
      if(response.status === 200 && response.data._embedded == null){
        bootstrap(); //Bootstrap the configurations if not avaiable
      } else {
        setFolderId(response.data._embedded.collection[0].id);
      }
    }
  
    /**
     * bootstrap() - Bootstrap the Content Metadata Service configurations
     */
    async function bootstrap() {
      setBootstrapLoader(true)

      try {

        console.log('Bootstrapping the CMS configurations')

        // Create a custom file type definition with appropriate attributes
        let requestBody = {
          "name": properties.cms_type,
          "display_name": properties.cms_type,
          "description": "Custom type for goose watch",
          "attributes":[
            {
              "name":"sighting_datetime",
              "data_type":"string"
            },
            {
              "name":"location",
              "data_type":"string"
            },
            {
              "name":"location_type",
              "data_type":"string"
            },
            {
              "name":"location_type_other",
              "data_type":"string"
            },
            {
              "name":"num_of_geese",
              "data_type":"string"
            },
            {
              "name":"behavior_observed",
              "data_type":"string"
            },
            {
              "name":"behavior_observed_other",
              "data_type":"string"
            },
            {
              "name":"person_name",
              "data_type":"string"
            },
            {
              "name":"person_email",
              "data_type":"string"
            },
            {
              "name":"person_phone",
              "data_type":"string"
            },
            {
              "name":"assist_required",
              "data_type":"string"
            },
            {
              "name":"status",
              "data_type":"string"
            }
          ]
        }
      
        let response = await api.post('/cms/type-definitions/file', requestBody)
        let data     = response.data
        console.log('CMS type created : ', data.name)

    
        // Create a custom folder that acts a placeholder for all our instances
        requestBody = {
          "name": properties.cms_folder,
          "display_name": properties.cms_folder,
          "description": "Folder to store Goose watch instances",
          "type": "cms_folder"
        }
      
        response = await api.post('/cms/instances/folder/cms_folder', requestBody)
        data     = response.data;
        let folder = data.id;
        setFolderId(folder);
        console.log('CMS folder created : ', folder)
      }
      finally {
        setBootstrapLoader(false)
      }
      
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
      const cssUrl = `${properties.css_url}/v2/tenant/${properties.tenant_id}/content`
      const formData = new FormData();
      formData.append("file", file);
 
      const response = await api.post(cssUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const cssFile  = await response.data.entries[0];
  
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
     * createMetadatAlongWithImage() - Create metadata and attach the uploaded image to it
     */
    async function createMetadatAlongWithImage(uploadedFile) {
  
      const name = createUniqueFileName(file.name);
      const typeSystemName = `def_${properties.cms_type}`;
  
      //Create the corresponding metadata in CMS  
      const url = `/cms/instances/file/${typeSystemName}?delete-source-file=true` 
      const requestBody = {
        "name": name,
        "description": "Goose watch instance with image",
        "parent_folder_id": folderId,
        "properties":{
          "sighting_datetime": `${inputs.sighting_datetime}`,
          "location": `${inputs.location}`,
          "location_type": `${inputs.location_type}`,
          "location_type_other": `${inputs.location_type_other}`,
          "num_of_geese": `${inputs.num_of_geese}`,
          "behavior_observed": `${inputs.behavior_observed}`,
          "behavior_observed_other": `${inputs.behavior_observed_other}`,
          "person_name": `${inputs.person_name}`,
          "person_email": `${inputs.person_email}`,
          "person_phone": `${inputs.person_phone}`,
          "assist_required": `${inputs.assist_required}`,
          "status":"OPEN"
        },
        "renditions": [{
            "name": name,
            "rendition_type": "primary",
            "blob_id": uploadedFile.id,
            "mime_type": uploadedFile.mimeType
        }]
      }
  
      const response = await api.post(url, requestBody);
      return response.data;
    }

    /**
     * createMetadatWithoutImage() - Create metadata without image
     */
    async function createMetadatWithoutImage() {

      const name = new Date().toISOString();
      const typeSystemName = `def_${properties.cms_type}`;

      //Create the corresponding metadata in CMS  
      const url = `/cms/instances/file/${typeSystemName}?delete-source-file=true` 
      const requestBody = {
        "name": name,
        "description": "Goose watch instance without image",
        "parent_folder_id": folderId,
        "properties":{
          "sighting_datetime": `${inputs.sighting_datetime}`,
          "location": `${inputs.location}`,
          "location_type": `${inputs.location_type}`,
          "location_type_other": `${inputs.location_type_other}`,
          "num_of_geese": `${inputs.num_of_geese}`,
          "behavior_observed": `${inputs.behavior_observed}`,
          "behavior_observed_other": `${inputs.behavior_observed_other}`,
          "person_name": `${inputs.person_name}`,
          "person_email": `${inputs.person_email}`,
          "person_phone": `${inputs.person_phone}`,
          "assist_required": `${inputs.assist_required}`,
          "status":"OPEN"
        }
      }
  
      const response = await api.post(url, requestBody);
      return response.data;
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
     * analyzeImageWithInfoIntel() - Determine risk level of uploaded image using Information Intelligence API. 
     */
    async function analyzeImageWithInfoIntel() {
    
      let formData = new FormData();
      formData.append('File', file, file.name);
  
      const url = `${properties.infointel_url}/api/v1/classify`
      let options = {
        headers: {
          'Accept': "application/json",
          'Content-Type': "multipart/form-data"
        },
        data: formData
      }
  
      const response = await api.post(url, options);
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
  
      //If user selected an image file to upload.
      if (file) {
        //Analyze image with Information Intelligence API

        //TODO : Need to check if the below commented code works with the latest changes
        // let riskLevel = await analyzeImageWithInfoIntel();
        // if (riskLevel !== 'noRisk') {
        //   console.log('handleSubmit - analyzeImageWithInfoIntel: ', riskLevel);
        //   alert('Error: Uploaded image has a '+riskLevel+' risk score and is not allowed.');
        //   return;
        // }
    
        //Upload image file to Content Storage
        let cssUploadedFile = await uploadFileToCSS();
        console.log('handleSubmit - cssUploadedFile: ', cssUploadedFile);
  
        if (!cssUploadedFile) {
          alert('Error: Unable to upload file to Content Storage. Please check logs for details.')
          return;
        }
  
        //Create image file metadata
        let fileMetadata = await createMetadatAlongWithImage(cssUploadedFile);
        console.log('handleSubmit - fileMetadata: ', fileMetadata);
      } else {
        let fileMetadata = await createMetadatWithoutImage();
        console.log('handleSubmit - fileMetadata: ', fileMetadata);
      }

      //If user requires assistance send email using Messaging Service

      //TODO : Need to check if the below commented code works with the latest changes
      // if (inputs.assist_required === "Y")
      //   sendMessageForAssistance();

      resetForm();
    }
  
    /***********************
     * Render page
     **********************/
    return (
      <main>
        <img src="goose-watch-logo.jpg" alt="Flowers in Chania" width="500" height="224"></img>
        <br/><br />
        <div className="ot2-body">
          {bootstrapLoader && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px' }}>
              <ClipLoader color="#4fa94d" size={50} />
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>
                Setting up thing for you...
              </p>
            </div>
          )}
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