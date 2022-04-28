var fs = require("fs");
const fsPromises = require('fs').promises;
//const readline = require('readline/promises');
var { google } = require("googleapis");
const { prompt } = require("enquirer");
var OAuth2 = google.auth.OAuth2;

/***********
 *
 *
 *
 * https://console.developers.google.com/apis/dashboard?project=ig-youtube
 * https://github.com/SBoudrias/Inquirer.js
 * https://github.com/enquirer/enquirer
 *
 *
 */

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
];
var TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";

var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

//var tokenStatus = checkTokenStatus();

function getChannel() {
  return new Promise(function (resolve, reject) {
    fs.readFile(
      "client_secret.json",
      function processClientSecrets(err, content) {
        if (err) {
          console.log("Error loading client secret file: " + err);
          return;
        }
        // Authorize a client with the loaded credentials, then call the YouTube API.
        authorize(JSON.parse(content), checkChannel)
          .then(function (channel) {
            getPlaylists();
            resolve(channel.id);
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    );
  });
}

function getPlaylists() {
  return new Promise(function (resolve, reject) {
    fs.readFile(
      "client_secret.json",
      function processClientSecrets(err, content) {
        if (err) {
          console.log("Error loading client secret file: " + err);
          return;
        }

        // Authorize a client with the loaded credentials, then call the YouTube API.

        authorize(JSON.parse(content), checkPlaylists)
          .then(function (playlists) {
            resolve(playlists);
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    );
  });
}

const getUserPlaylists = async () => {
  try {
    const read = await fsPromises.readFile("client_secret.json");
    const content = JSON.parse(read.toString());
    const auth = await authorizeFunction(content)

    const res = await checkPlaylistsFunction(auth);
    return res;

  } catch (err) {
    console.log("Error loading client secret file: " + err);
    return;
  }
}

const addVideoToPlaylist = async (playlistId, videoId) => {
  try {
    const read = await fsPromises.readFile("client_secret.json");
    const content = JSON.parse(read.toString());
    const auth = await authorizeFunction(content)

    const res = await addToPlaylistFunction(auth, playlistId, videoId);
    return res;

  } catch (err) {
    console.log("Error loading client secret file: " + err);
    return;
  }
}


const uploadVideo2 = async (name, description, videoFilePath) => {
  try {
    const read = await fsPromises.readFile("client_secret.json");
    const content = JSON.parse(read.toString());
    const auth = await authorizeFunction(content)
    console.log(auth);
    const res = await upload2(auth, name, description, videoFilePath);
    console.log("res")
    console.log(res)
    return res;
  } catch (err) {

    console.log("Error loading client secret file: " + err);
    return;
  }
}



async function uploadVideo(name, description, videoFilePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(
      "client_secret.json",
      function processClientSecrets(err, content) {
        if (err) {
          console.log("Error loading client secret file: " + err);
          return;
        }

        // Authorize a client with the loaded credentials, then call the YouTube API.
        authorize(JSON.parse(content), (auth) =>
          upload(auth, name, description, videoFilePath)
            .then(function (uploadedVideoData) {
              resolve(uploadedVideoData.id);

            }).catch(function (err) {
              console.log("err: ", err)
            })
        );
      }
    );
  })
}

function addToPlaylist(playlistId, videoId) {
  fs.readFile(
    "client_secret.json",
    function processClientSecrets(err, content) {
      if (err) {
        console.log("Error loading client secret file: " + err);
        return;
      }

      // Authorize a client with the loaded credentials, then call the YouTube API.
      authorize(JSON.parse(content), (auth) =>
        add(auth, playlistId, videoId)
      );
    }
  );
}

function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  return new Promise(function (resolve, reject) {
    fs.readFile(TOKEN_PATH, function (err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        resolve(callback(oauth2Client));
      }
    });
  });
}

const authorizeFunction = async (credentials, callback) => {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  try {
    const read = await fsPromises.readFile(TOKEN_PATH);
    const token = JSON.parse(read.toString());
    oauth2Client.credentials = token;
    return oauth2Client;
  } catch (err) {
    const authClient = await getNewTokenFunction(oauth2Client);
    return authClient;
  }






  /*  fs.readFile(TOKEN_PATH, async function (err, token) {
   if (err) {
     getNewToken(oauth2Client, callback);
   } else {
     oauth2Client.credentials = JSON.parse(token);
     const response = await callback(oauth2Client);

     return response;
   }
 });

 console.log(pepe); */

}

const getNewTokenFunction = async (oauth2Client) => {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);

  const tokenPrompt = [{
    type: 'input',
    message: "Enter the code from that page here: ",
    name: "answer",
  }];

  try {
    const tokenPromptAnswer = await prompt(tokenPrompt);
    const code = tokenPromptAnswer.answer;
    const tokenData = await oauth2Client.getToken(code);
    const token = tokenData.tokens;
    console.log("token");
    console.log(token);
    oauth2Client.credentials = token;
    storeToken(token);
    return oauth2Client;

    /*  oauth2Client.getToken(code, function (err, token) {
       if (err) {
         console.log("Error while trying to retrieve access token", err);
         return;
       }
       console.log("token");
       console.log(token);
       oauth2Client.credentials = token;
       storeToken(token);
       console.log(oauth2Client);
       return oauth2Client;
     }); */


  }
  catch (e) {
    console.log(e);
  }


  /*   try {
      const token = await oauth2Client.getToken(code)
      oauth2Client.credentials = token;
      storeToken(token);
      console.log(oauth2Client);
      rl.close();
      return oauth2Client;
    }
    catch (err) {
      console.log("Error while trying to retrieve access token", err);
      return;
    } */






}


async function getNewToken(oauth2Client) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      return oauth2Client;
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

async function checkChannel(auth) {
  var service = google.youtube("v3");
  var request = await service.channels.list({
    auth: auth,
    part: "snippet,contentDetails,statistics",
    mine: true,
  });

  return request.data.items[0];
}

async function checkPlaylists(auth) {
  var service = google.youtube("v3");
  var request = await service.playlists.list({
    auth: auth,
    part: "id, snippet",
    mine: true,
  });

  return request.data.items;
}

async function checkPlaylistsFunction(auth) {
  var service = google.youtube("v3");
  var request = await service.playlists.list({
    auth: auth,
    part: "id, snippet",
    mine: true,
  });

  return request.data.items;
}


/**
 * Upload the video file.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

async function upload(auth, name, description, videoFilePath) {
  //console.log(name, description, playlistId, videoFilePath);
  return new Promise(function (reject, resolve) {

    var service = google.youtube("v3");
    service.videos.insert(
      {
        auth: auth,
        part: "snippet,status",
        requestBody: {
          snippet: {
            title: name,
            description: description,
          },
          status: {
            privacyStatus: "unlisted", // default for now
          },
        },
        media: {
          body: fs.createReadStream(videoFilePath),
        },
      },
      function (err, response) {
        if (err) {
          console.log("The API returned an error: " + err);
          return;
        }
        console.log("el pepppeeee")
        resolve(response.data)
      }
    );

  })
}

const upload2 = async (auth, name, description, videoFilePath) => {

  var service = google.youtube("v3");
  var request = await service.videos.insert({
    auth: auth,
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: name,
        description: description,
      },
      status: {
        privacyStatus: "unlisted", // default for now
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  });
  return request.data;

  /* service.videos.insert(
    {
      auth: auth,
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: name,
          description: description,
        },
        status: {
          privacyStatus: "unlisted", // default for now
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      console.log("okkk")
      return response.data
    }
  ); */


}


/**
 * Add a video to a playlist.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */


function add(auth, playlistId, videoId) {
  var service = google.youtube("v3");
  service.playlistItems.insert(
    {
      auth: auth,
      part: "id,snippet",
      resource: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            videoId: videoId,
            kind: "youtube#video"
          }
        }
      }
    },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      console.log("okkkkkk")
      console.log(response.data);
    }
  );
}

const addToPlaylistFunction = async (auth, playlistId, videoId) => {

  var service = google.youtube("v3");
  var request = await service.playlistItems.insert({
    auth: auth,
    part: "id,snippet",
    resource: {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          videoId: videoId,
          kind: "youtube#video"
        }
      }
    }
  });
  console.log(request);
  return request;
}
/* function accountStatus() {
  fs.readFile(
    "client_secret.json",
    function processClientSecrets(err, content) {
      if (err) {
        console.log("Error loading client secret file: " + err);
        return;
      }

      fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
          return false;
        } else {
          return true;
        }
      });
    }
  );
} */


const accountStatus = async () => {
  try {
    await fsPromises.readFile(TOKEN_PATH);
    return true;
  } catch (err) {
    console.log("Error loading client secret file: " + err);
    return false;
  }

}

module.exports = {
  accountStatus,
  getChannel,
  getPlaylists,
  uploadVideo,
  addToPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  uploadVideo2
};
