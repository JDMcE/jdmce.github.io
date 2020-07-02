---
title: "Hack the Box Invitation Code"
date: 2020-05-13T15:34:30-04:00
categories:
  - blog
tags:
  - HTB
  - Hack The Box
  - WriteUp
---


So you want to hack some boxes? Well first you have to sign up.

![HTB Invite](/assets/SigningUp/HTB_invite_screen.png)

We are told that to get an invite code we have to hack the page. Lets have a look at the console. In Chrome press f12 to bring up dev tools and click on the console tab.

![Console](/assets/SigningUp/console_message.png)

"This page loads an interesting javascript file." That sounds interesting, lets have a look at the javascript files that the page loads. Click on the sources tab and have a look in the js folder.

One of the javascript files is called inviteapi.min.js. which sounds useful.

It contains the following code:

```js
//This javascript code looks strange...is it obfuscated???

eval(function(p,a,c,k,e,r){e=function(c){return c.toString(a)};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('0 3(){$.4({5:"6",7:"8",9:\'/b/c/d/e/f\',g:0(a){1.2(a)},h:0(a){1.2(a)}})}',18,18,'function|console|log|makeInviteCode|ajax|type|POST|dataType|json|url||api|invite|how|to|generate|success|error'.split('|'),0,{}))
```

If we read through this code we see something called makeInviteCode, that seems usefull. The comment suggests that the code has been obfuscated, lets try and make the code more readable.

Copy and Paste the code into [beautifier.io](https://beautifier.io/) and we get the following output:

```js
function makeInviteCode() {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: '/api/invite/how/to/generate',
        success: function(a) {
            console.log(a)
        },
        error: function(a) {
            console.log(a)
        }
    })
}
```

Thats much nicer, makeInviteCode() is a function. So lets call that function by typing it into the console.

![makeInviteCode](/assets/SigningUp/makeinvitecode.png)

We get some data!

The data is encrypted so we need to decrypt it, we can see that the "enctype" is BASE64 so lets head over to [CyberChef](https://gchq.github.io/CyberChef/) (There are simpler tools to decode BASE64 online, however cyberchef is a very powerful tool and I would recommend learning it).

![Cyberchef](/assets/SigningUp/Cyberchef.png)

We get the following output:


>In order to generate the invite code, make a POST request to /api/invite/generate


So lets do that then.
```
curl -XPOST https://www.hackthebox.eu/api/invite/generate
```

And we get more data!
```
{"success":1,"data":{"code":"VlBSTFUtUFNJT0YtQkRNTlYtQ09HWU8tUFNRT1M=","format":"encoded"},"0":200}
```

Almost there! The format is "encoded" so again we need to decode the BASE64. Back to [CyberChef](https://gchq.github.io/CyberChef/), and after decoding we have our invite code!

Welcome to Hack the Box!