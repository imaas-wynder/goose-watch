//import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { properties } from "./properties";

/**
 * TBD: Display data on a seperate page linked from the Form page
 */
function Report() {

    const isLoaded = useRef(false);
    const [responseData, setResponseData] = useState("");
    
    useEffect(() => {
        if (!isLoaded.current)
            queryGooseWatchData();

        isLoaded.current = true;
    }, []);

    async function queryGooseWatchData() {
        console.log("queryGooseWatchData");
    
        const url = properties.server_url
        axios.get(url)
        .then(res => res.data)
        .then(data => {
            console.log('queryGooseWatchData - response: ', data);
            setResponseData(data);
        })
        .catch(error => {
            console.log('queryGooseWatchData - error: ', error.message);
        })
    }

    return (responseData);
/*  (
        <>
            <h1>Goose Watch Report</h1>
            <p>
                <Link to="/">Click here to access the Goose Watch Form</Link>
            </p>
        </>
    )*/
}

export default Report;