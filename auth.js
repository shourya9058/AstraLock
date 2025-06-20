// Add SHA-256 implementation at the top
function sha256(ascii) {
    function rightRotate(v, c) { return (v>>>c)|(v<<(32-c)); }
    var mathPow=Math.pow,maxMath=Math.max;
    var result = "", i, j, k, l, W = new Array(64), H = [1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225], K = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
    ascii += '\x80';
    while (ascii.length%64-56) ascii += '\x00';
    for (i=0; i<ascii.length; i++) {
        j = ascii.charCodeAt(i);
        if (j>>8) return;
        result += String.fromCharCode(j);
    }
    var l = ascii.length-1;
    var words = [];
    for (i=0; i<ascii.length; i++) words[i>>2] |= ascii.charCodeAt(i) << (24-(i%4)*8);
    words[words.length] = ((l*8)>>29)&0xFF;
    words[words.length] = ((l*8)>>21)&0xFF;
    words[words.length] = ((l*8)>>13)&0xFF;
    words[words.length] = ((l*8)>>5)&0xFF;
    words[words.length] = ((l*8)<<3)&0xFF;
    for (j=0; j<words.length; j+=16) {
        var oldH = H.slice(0);
        for (i=0; i<64; i++) {
            if (i<16) W[i] = words[j+i]|0;
            else {
                var gamma0 = rightRotate(W[i-15],7)^rightRotate(W[i-15],18)^(W[i-15]>>>3);
                var gamma1 = rightRotate(W[i-2],17)^rightRotate(W[i-2],19)^(W[i-2]>>>10);
                W[i] = (W[i-16] + gamma0 + W[i-7] + gamma1)|0;
            }
            var ch = (H[4]&H[5])^((~H[4])&H[6]);
            var maj = (H[0]&H[1])^(H[0]&H[2])^(H[1]&H[2]);
            var sigma0 = rightRotate(H[0],2)^rightRotate(H[0],13)^rightRotate(H[0],22);
            var sigma1 = rightRotate(H[4],6)^rightRotate(H[4],11)^rightRotate(H[4],25);
            var t1 = (H[7] + sigma1 + ch + K[i] + W[i])|0;
            var t2 = (sigma0 + maj)|0;
            H = [(t1+t2)|0,H[0],H[1],H[2],(H[3]+t1)|0,H[4],H[5],H[6]];
        }
        for (i=0; i<8; i++) H[i] = (H[i]+oldH[i])|0;
    }
    for (i=0; i<8; i++) for (j=3; j+1; j--) {
        var b = (H[i]>>(j*8))&255;
        result += ((b>>4).toString(16)) + ((b&15).toString(16));
    }
    return result.slice(-64);
}

// Check if password already set
chrome.storage.sync.get("pg_password", (result) => {
    if (result.pg_password) {
      // Password already set
      document.getElementById("password-not-set").style.display = "none";
      document.getElementById("password-already-set").style.display = "block";
    } else {
      // Allow to set new password
      document.getElementById("set-password").addEventListener("click", () => {
        const newPassword = document.getElementById("new-password").value;
        const userEmail = document.getElementById("user-email").value;
  
        if (newPassword.length < 6) {
          document.getElementById("status").textContent = "Password must be at least 6 characters.";
          return;
        }

        if (!userEmail || !validateEmail(userEmail)) {
          document.getElementById("status").textContent = "Please enter a valid email address.";
          return;
        }
  
        // Hash the password before storing
        const hashedPassword = sha256(newPassword);

        chrome.storage.sync.set({ 
          pg_password: hashedPassword,
          pg_email: userEmail 
        }, () => {
          document.getElementById("status").textContent = "Password and email saved successfully!";
          setTimeout(() => {
            window.close();
          }, 1000);
        });
      });
    }
});

// Email validation function
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
  