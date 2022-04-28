const instagram = require("./instagram")
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { prompt } = require("enquirer");
const youtube = require("./youtube.js");
const Instagram = require('instagram-web-api')
const FileCookieStore = require('tough-cookie-filestore2')
const tmpFolderName = "videos";

const igCredentials = require('./conf/credentials.json')
const username = igCredentials.username;
const password = igCredentials.password;

const cookieStore = new FileCookieStore('./cookies.json')
const client = new Instagram({ username, password, cookieStore })


/* Create the temp folder */

fs.mkdir(path.join(__dirname, tmpFolderName), (err) => {
    if (err) {
        if (err.code === "EEXIST") {
            return
        } else {
            return console.error(err);
        }
    }
});


const runPrompts = async () => {

    try {
        await client.login()
        const instagramCookie = getCookie(cookieStore);
        const youtubeAccountStatus = await youtube.accountStatus();

        const mainPrompChoices = ["Connect your youtube account", "Select a playlist to save the videos", "Download a video from instagram", "Save a video to youtube", "Exit"]

        const mainPrompt = [{
            type: 'select',
            name: "answer",
            message: "Select an option",
            choices: [
                { message: mainPrompChoices[0], disabled: youtubeAccountStatus ? "(Already connected)" : false },
                { message: mainPrompChoices[1] },
                { message: mainPrompChoices[2] },
                { message: mainPrompChoices[3] },
                { message: mainPrompChoices[4] },
            ],
        }];

        const mainPromptAnswer = await prompt(mainPrompt);

        const videoUrlPrompt = [{
            type: 'input',
            message: "Enter the video URL: ",
            name: "answer",
            initial: "http://instagram.com/example_video",
        }];

        switch (mainPromptAnswer.answer) {
            case mainPrompChoices[0]:
                break;

            case mainPrompChoices[1]:
                break;

            case mainPrompChoices[2]:
                break;

            case mainPrompChoices[3]:
                const videoUrl = await prompt(videoUrlPrompt);
                await saveToYoutube(videoUrl.answer, instagramCookie)

            case mainPrompChoices[4]:
                process.exit();
        }


    }
    catch (e) {
        console.log("There was an error: ", e);
    }


}

const saveToYoutube = async (url, instagramCookie) => {

    try {
        const videoData = await instagram.getPostLink(url, instagramCookie);
        const videoURL = videoData.link;
        const videoCaption = videoData.caption;
        console.log(videoCaption)

        const video = await download(
            videoURL,
            `${tmpFolderName}\\${videoCaption}.mp4`
        );
        if (video.mime == "video/mp4" && video.size > 0) {

            const addToPlaylistPrompt = [{
                type: 'select',
                message: "Do you want to save the video on a specific playlist?",
                name: "answer",
                choices: [
                    { message: "Yes" }, { message: "No" }
                ],
            }];

            const addToPlaylist = await prompt(addToPlaylistPrompt);
            if (addToPlaylist.answer == "Yes") {

                const uploadedVideoData = await youtube.uploadVideo2(
                    videoCaption,
                    `Uploaded on ${new Date()}`,
                    `${tmpFolderName}\\${videoCaption}.mp4`)

                console.log(uploadedVideoData);

                const videoId = uploadedVideoData.id;

                const userPlaylists = await youtube.getUserPlaylists()

                let choice = {};
                let choices = [];

                for (var i in userPlaylists) {
                    choice.name = userPlaylists[i].id;
                    choice.message = userPlaylists[i].snippet.title;
                    //choice.value = playlists[i].id;
                    choices.push(choice);
                    choice = {};
                }

                const playlistsPrompt = [{
                    type: 'select',
                    message: "Select a playlist to save the video:",
                    name: "answer",
                    choices: choices
                }];

                const playlist = await prompt(playlistsPrompt);
                const playlistId = playlist.answer;

                const addedToPlaylistVideo = await youtube.addVideoToPlaylist(playlistId, videoId)









            }
        }



    }
    catch (e) {
        console.log("There was an error while downloading the video:", e);
        console.log(e);
    }



}

const download = async (url, filePath) => {
    const proto = !url.charAt(4).localeCompare("s") ? https : http;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        let fileInfo = null;

        const request = proto.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            fileInfo = {
                mime: response.headers["content-type"],
                size: parseInt(response.headers["content-length"], 10),
            };

            response.pipe(file);
        });

        // The destination stream is ended by the time it's called
        file.on("finish", () => resolve(fileInfo));

        request.on("error", (err) => {
            fs.unlink(filePath, () => reject(err));
        });

        file.on("error", (err) => {
            fs.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

const getCookie = (cookieStore) => {

    const cookieObject = cookieStore.idx['instagram.com'];
    const igCookie = cookieObject['/'];
    let cookie = '';

    for (var i in igCookie) {
        for (var j in igCookie[i]) {
            if (j == "value") {
                cookie += `${i}=${igCookie[i][j]};`
            }

        }
    }

    return cookie;

}

runPrompts();

