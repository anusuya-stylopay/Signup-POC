const { default: axios } = require("axios");
const { getToken } = require("../services/authService");
const { loginRequired } = require("../utils/config");

const getDetails = async (req, res) => {
  if (!req.session.userData) {
    return res.status(401).send({ error: "Login Required" });
  }
  let path;
  console.log("sessionDtaa", req.session.userData.data[0].profile);
  req.session.userData.data[0].profile === "student"
    ? (path = "Contacts")
    : req.session.userData.data[0].profile === "agent"
    ? (path = "Vendors")
    : (path = "Counsellors");
  const token = await getToken();

  const apiUrl = `https://api.sandbox.edbucket.com/crm/api/v1/${path}/${req.session.userData.data[0].id}`;
  const headers = {
    Authorization: `Zoho-oauthtoken ${token.access_token}`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  const params = {
    fields:
      "First_Name,Last_Name,Date_of_Birth,Nationality,Email,Phone,Street_Address,Street_Address_Line_2,Mailing_City,Mailing_State,Mailing_Zip,Please_upload_photo_identification_of_yourself,Mailing_Country",
  };

  try {
    const response = await axios.get(apiUrl, { params: params, headers });
    return res.send(response.data);
  } catch (error) {
    return res
      .status(error.response ? error.response.status : 500)
      .send(error.message);
  }
};

const updateDetails = async (req, res) => {
  if (!req.session?.userData) {
    return res.status(401).send({ error: "Login Required" });
  }

  // Determine path based on profile
  const { profile, id, Email, Phone, Name, Vendor_Name } = req.session.userData.data[0];
  const path = profile === "student" ? "Contacts" : profile === "agent" ? "Vendors" : "Counsellors";

  // Construct API URL
  const apiUrl = `https://api.sandbox.edbucket.com/crm/api/v1/${path}/${id}`;
  const token = await getToken(); // Assuming getToken() is a defined function

  // Set up headers
  const headers = {
    Authorization: `Zoho-oauthtoken ${token.access_token}`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  // Base request body
  const request_Body = {
    data: [
      {
        Email,
        Phone,
        Date_of_Birth: req.body.Date_of_Birth || null,
        Nationality: req.body.Nationality || null,
        ISD_Code: req.body.countryCode || null,
        Street_Address: req.body.Street_Address || null,
        Street_Address_Line_2: req.body.Street_Address_Line_2 || null,
        Mailing_City: req.body.Mailing_City || null,
        Mailing_State: req.body.Mailing_State || null,
        Mailing_Zip: req.body.Mailing_Zip || null,
        Mailing_Country: req.body.Mailing_Country || null,
        Gender: req.body.Gender || null,
      },
    ],
  };

  // Add profile-specific fields
  if (Vendor_Name) {
    const Full_Name = Vendor_Name;
    const FirstName = Full_Name.split(" ").length < 2 ? Full_Name : Full_Name.substring(0, Full_Name.lastIndexOf(" "));
    const LastName = Full_Name.split(" ").length < 2 ? "" : Full_Name.split(" ").pop();
    Object.assign(request_Body.data[0], {
      First_Name: FirstName,
      Last_Name: LastName,
      Vendor_Name: Full_Name,
      City: req.body.City || null,
      Street: req.body.Street || null,
      Country: req.body.Country || null,
      send_invite: req.body.send_invite || null,
      GL_Account: req.body.GL_Account || null,
      Email_Opt_Out: req.body.Email_Opt_Out || null,
      Description: req.body.Description || null,
      Zip_Code: req.body.Zip_Code || null,
    });
  } else if (Name) {
    const Full_Name = Name;
    const FirstName = Full_Name.split(" ").length < 2 ? Full_Name : Full_Name.substring(0, Full_Name.lastIndexOf(" "));
    const LastName = Full_Name.split(" ").length < 2 ? "" : Full_Name.split(" ").pop();
    Object.assign(request_Body.data[0], {
      Name: Full_Name,
      First_Name: FirstName,
      Last_Name: LastName,
      Email_Opt_Out: req.body.Email_Opt_Out || null,
      Secondary_Email: req.body.Secondary_Email || null,
    });
  } else {
    Object.assign(request_Body.data[0], {
      First_Name: req.session.userData.data[0].First_Name,
      Last_Name: req.session.userData.data[0].Last_Name,
      Educational_Qualification: req.body.Educational_Qualification || null,
      Country_interested_to_Study: req.body.Country_interested_to_Study || null,
      Course_Preferences: req.body.Course_Preferences || null,
      send_invite: req.body.send_invite || null,
      Lead_Source: req.body.Lead_Source || null,
    });
  }

  console.log("Request Body:", request_Body);

  // Make the API call
  try {
    const response = await axios.put(apiUrl, request_Body, { headers });
    console.log("Profile Update Response:", response.data);
    return res.send(response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return res
      .status(error.response?.status || 500)
      .send(error.response?.data || { error: error.message });
  }
};


module.exports = { getDetails, updateDetails };
