addEventListener("fetch", event => {
  const { request } = event;
  if (request.method === 'POST') {
    event.respondWith(handlePost(request));
    return
  } 
  event.respondWith(handleGet(request));
})

const pootifierUrl = 'https://pootify.com/url/';
const withoutSlash = 'https://pootify.com/url';
async function handleGet(request) {

  const targetUrl = request.url.replaceAll(pootifierUrl,'');
  // console.log(targetUrl);

  if(targetUrl == withoutSlash || targetUrl == '') {
      return homepage();
  }
  if(!isValidUrl(targetUrl) || targetUrl == withoutSlash) {
    return new Response(
        `invalid URL: ${targetUrl}<br>
         must be in format: ${pootifierUrl}http://somewebsite.com`, {
      headers: {
      'content-type': 'text/html;charset=UTF-8',
    }})
  } 

  const response = await fetch(targetUrl, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
  });

  const html = await response.text();

  const url = new URL(targetUrl);
  const pageBaseUrl = `${url.protocol}//${url.hostname}`;

  // base adjustment
  const replace1 = html.replace("<head>",`<head><base href="${pageBaseUrl}"/><script type="text/javascript">History.replaceState = function(){};history.replaceState = function(){};</script>`);

  // insert script
  const replace2 = replace1.replace("</head>",String.raw`
<script type="text/javascript">

${pootifyScript}

function pootifier () {
    pootify_document(document.body);
    pootify_links(document.body, '${pageBaseUrl}', '${pootifierUrl}');
}

function add_pootifier () {
    var prior_onload = window.onload; 
    if (typeof prior_onload != 'function') { 
        window.onload = pootifier;
    } else { 
        window.onload = function() { 
            if (prior_onload) { 
                prior_onload(); 
            }
            pootifier(); 
        };
    }
}

</script></head>`)

  // call the script
  const replace3 = replace2.replace("</body>", `
  <script type="text/javascript">
    add_pootifier();
  </script>
  </body>`);

  return new Response(replace3, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}

async function handlePost(request) {
  return new Response("Hello world")
}

async function homepage() {
  return new Response(`
  <html>
  <head>
    <title>The Pootifier</title>
  </head>
  <body>
  <center>
    <h2>The Pootifier</h2>
    <p><input type="text" id="url"></p>
    <p><img id="submit" onclick="gotoUrl()" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAcAFgDASIAAhEBAxEB/8QAGwAAAwEAAwEAAAAAAAAAAAAABQYHAAIECAP/xAA5EAABAwMDAgIGBQ0AAAAAAAABAgMEBQYRABIhBzETURQiQWFxkRVCgdHiIzJDRFNldYKTlLHB4f/EABkBAAMBAQEAAAAAAAAAAAAAAAECAwQFBv/EACQRAAIBAwQCAgMAAAAAAAAAAAECAAMRIQQFEjEUQVGRYbHw/9oADAMBAAIRAxEAPwC3Jan1CemNTl05pCIjLyjIhh0qKwc85Hl7++h9TkNU2UY1TuWzYkn9lIYbbX8lLzo9apBqyj+7Iv8AhWvON8QaVDvHqWwphsZ8L0VGMqLzgCvV9uSpROB/rWakgAAtDXrPTYgH2fcutUpL0CJ6VVJ9pxouQPGk09CEZPb1lKxrM249IhJmsv2m5EUjxA+imIKCnGd27djHv1FKG1Prl1WtbFSKlRaXEQQ0o5SVqAyr5Yx8NCn6zIjM1e0qU86iiya26htIV+hSvhHw5STjy1rSmzYBkjq6gySfuegKTSl1GOp+kVG0pbKVbS5FgIcSD5ZSrvogKBXB+s0ED+G/i1HqhRfR77at+mOmOKhT2DJ2EpysLCweOxwE4Ps0VpVn1yvXJUIEm56qTSJKCwZDqnAlaAhYOM+auFd+Aee2szm5+Ynm1ibC5zbuPkFx+ZMXEgXFaj8pGSplmOhS04ODlIXkc8aKqo1wYG+fRMZxzT/xakkGhxV9QrygSozDvgQjhPO3f4Gc579+dBLAts196nrjVuoJnseHJbbdKtiVhQ4TnGeArkZxx56KUUYEn9QJqqjGx7z7+DaWuRTqiy3JcfqltoRFG59S4KQGhjOVkq9Xjnn2aH1xh2kGEKxUbbY9NfEZguUrIW4QSBnOBwDycDUzuqkXTZtcfp5m/SUS621MuvPJ3KbcIAdOO2dudo7YwPq6M9VbdqNI6cWk0pb01NPqjCnFqGVNIIKU7iO/JAzxyRpigS3GW8irYkE4/McLmoC4Vn1yRMao7jghuKZXFp6GlIVx6wVyc88YxjvraP3QQ90/kd8LgEc/yDW1RNUKQs09Js7ckbmb5nCyyXJLTgBIVSYZJ+KVan9F6f1R/rDW6zc9JaegSnSuM+0vISkZSnyI9UJzpKh9XLnpyUQYqoKWI6UsIJjgqKUDaMnPJwNH4HVa55AG9+KPgwNK6cMzkVdCzuWuO43X1Z1YgXU3dNmQ48iUYvozkZatmxSRhDifYcDAKeOw8zpYovR2pRrRivoCPp6LJEpLTqsB4fXQTzgnjB9wz347jfUe4lHmQx/QTojHvmvONlSpTefcyn7tQ8wJiQbQkdznYln12ReM65LjiojSln8k0VZSkJAShOR3AAGT7tFLOgXXS72qcqt02OqJUV7y/Ed3JQrahI9U+sBhGcnS/I6gXA2Ttktfayn7tdJ7qXciEkiQxx5sJ0q1kc4gTbzix6n1Nq3zHum4av8ARsN9VTZcaPhSduwlspSU5weMj5fbp16Q06p0y3kQa7SxFkxiEodBB3pAAHvzxqUTusV1x1EIdhn4xxoeOt137seJA/tv+61LTJXEKbc1M3B/vqV3qtSrgqVZt1+iU1qVGgPqedUp7ao7klBATj2A5znk8Y0E6i3rdNLutEKI3Bp1OEVLrYqEdbqJq1fno3IyQU9toGec8g8KEDq/dUgje9DGfKONGF9Qq9Ka2SFxXEHnauMhQ+RGp1GCDMdtBU9GUWbPNW6erklhDC3Ihy0g5CDlHHu+B5Ht1tIzN4VefH9DkOs+jODapCGUpGPsGtrhbhXuw4zpaHlQUif/2Q=="></p>
  </center>
  <script type="text/javascript">
    var url = document.getElementById('url');
    function gotoUrl() {
        window.location = "${pootifierUrl}" + url.value;
    }
  </script>
  </body>
  </html>
  `, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}

const isValidUrl = urlString=> {
      try { 
      	return Boolean(new URL(urlString)); 
      }
      catch(e){ 
      	return false; 
      }
  }

const pootifyScript = String.raw`

// down here is pootifier code... incomplete
function pootify_word (word) {
    if (word.length < 4) {
        return word;
    } else if (word.length < 8) {
        var poot = '';
        for (var i = 0; i < 4; ++i) {
            if ((word.charCodeAt(i) >= 65) && (word.charCodeAt(i) <= 90)) {
                poot += 'POOT'.charAt(i);
            } else {
                poot += 'poot'.charAt(i);
            }
        }
        return poot;
    }
    var pootpoot = '';
    for (var i = 0; i < 8; ++i) {
        if ((word.charCodeAt(i) >= 65) && (word.charCodeAt(i) <= 90)) {
            pootpoot += 'POOTPOOT'.charAt(i);
        } else {
            pootpoot += 'pootpoot'.charAt(i);
        }
    }
    return pootpoot;
}

function pootify_text (text) {
    var pootified = '';
    var word      = '';
    for (var i = 0; i < text.length; ++i) {
        if (/\W/.test(text.charAt(i))) {
            pootified += pootify_word(word);
            word       = '';
            pootified += text.charAt(i);
        } else {
            word += text.charAt(i);
        }
    }
    pootified += pootify_word(word);
    return pootified;
}

function pootify_document (target) {
    for (var l in target.childNodes) {
        var node = target.childNodes[l];
        if (node.nodeType == 3) {
            if (/\S/.test(node.nodeValue) && node.parentElement.tagName !== 'STYLE' && node.parentElement.tagName !== 'SCRIPT') {
                // console.log(node.parentElement.tagName);
                // console.log(node);
                node.parentNode.replaceChild(document.createTextNode(pootify_text(node.nodeValue)), node);
            }
        } else if (node.nodeType == 1)  {
            pootify_document(node);
        }
    }
    return;
}

function pootify_link (node, attribute_index, base_current, base_pootifier) {
    var v = node.attributes[attribute_index].value;
    if (! /^https?:\/\//.test(v)) {
        v = base_current + v;
    }
    node.attributes[attribute_index].value = base_pootifier + v;
}

function pootify_links (target, base_current, base_pootifier) {
    for (var l in target.childNodes) {
        var node = target.childNodes[l];

        if (node.nodeName == 'FRAME') {
            for (var a in node.attributes) {
                if (node.attributes[a].name == 'src') {
                    pootify_link(node, a, base_current, base_pootifier);
                }
            }
        }

        if (node.nodeName == 'A') {
            for (var a in node.attributes) {
                if (node.attributes[a].name == 'href') {
                    pootify_link(node, a, base_current, base_pootifier);
                }
            }
        }

        if (node.nodeType == 1) {
            pootify_links(node, base_current, base_pootifier);
        }
    }
    return;
}

`;

