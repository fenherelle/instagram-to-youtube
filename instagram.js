const axios = require("axios");
const { parse } = require("node-html-parser");

const igLongUrl = 'www.instagram.com';
const igShortUrl = 'instagram.com';
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36'


function formatUrl(url) {

  var urlParts = url.split("/");

  if (urlParts[2] == igLongUrl || urlParts[2] == igShortUrl) {
    return { videoCode: urlParts[4], mediaType: urlParts[3] }
  }

  return null;
}


async function getPostLink(url, cookie) {

  const baseUrl = "https://www.instagram.com"
  const formattedUrl = formatUrl(url)
  const graphqlUrl = `${baseUrl}/${formattedUrl.mediaType}/${formattedUrl.videoCode}/?__a=1`

  try {
    const response = await axios.get(graphqlUrl, { headers: { 'User-Agent': userAgent, 'Cookie': cookie } });
    let link = '';
    let caption = '';

    link = response.data.items[0].video_versions[0].url;
    caption = getCaption(response.data)

    return { link, caption }
  } catch (e) {
    console.log("There was an error processing the video URL:", e);
  }

  /*   let res = axios.get(url).then(async (response) => {
  
      console.log("sadadsad");
      console.log(response)
      const root = parse(response.data);
  
      let link = "";
      if (response.data.search("video_url") != -1)
        link = getVideoLinkFromHtml(response.data);
      else
        link = root.querySelector("img.EmbeddedMediaImage").getAttribute("src");
  
      while (link.search("&amp;") != -1) {
        link = link.replace("&amp;", "&");
      }
      let caption = await getCaptionFromHtml(response.data);
  
      return { link, caption };
    }).catch(function (err) {
      console.log("asdasdasd");
      console.log(err);
    });
    return res;
   */



}

/* async function getCaption(url) {
  url = url + "embed" + "/captioned";

  let res = axios.get(url).then((response) => {
    let caption = getCaptionFromHtml(response.data);

    return caption;
  });

  return res;
} */

/* async function getCaptionFromHtml(html) {
  const root = parse(html);
  let caption = {};
  let username = root.querySelector(".Username").textContent.trim();
  let captionData = root.querySelector(".Caption");

  if (captionData != null) {
    let childNodes = captionData.childNodes;
    let captionText = [];

    for (var i in childNodes) {
      if (childNodes[i].textContent.trim() != "")
        captionText.push(childNodes[i].textContent.trim());
    }

    caption.username = captionText[0];
    caption.text = captionText[1];
  } else {
    caption.username = username;
  }

  if (caption.text == undefined) caption.text = "Video had no caption.";

  return caption;
}

function getVideoLinkFromHtml(html) {
  let crop =
    '{"' +
    html.substring(html.search("video_url"), html.search("video_url") + 1000);

  crop = crop.substring(0, crop.search(",")) + "}";

  return JSON.parse(crop).video_url;
}
 */
const getCaption = (videoData) => {

  if (videoData.items[0].caption) {
    let caption = videoData.items[0].caption.text;
    return caption.replace("\n", "");
  }

  return 'No caption'

}


module.exports = {
  getPostLink
}
