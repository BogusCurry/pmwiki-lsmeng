<?php

// Abort if encryption related extension is not enabled
if (!function_exists("openssl_encrypt")) { Abort("\"openssl_encrypt\" is not supported!"); }

// Abort if compression related extension is not enabled
if (!function_exists("bzcompress")) { Abort("\"bzcompress\" is not supported!"); }

$OPENSSL_METHOD = "AES-256-CBC";

// Keyword used for identifying encrypted page files. If the text content of a page file
// is preceded by this keyword, the page file has been encrypted.
$ENC_KEYWORD = "ENC";
$ENC_KEYWORD_LEN = strlen($ENC_KEYWORD);
// Set the length of the initialization vector based on encryption method.
$IV_LEN = openssl_cipher_iv_length($OPENSSL_METHOD);
$SALT_LEN = 64;
$PBKDF2_ITERATION_FOR_AES = 1000;
$PBKDF2_ITERATION_FOR_MASTER_KEY = 100000;
$NUM_RECENTPAGEAESKEY = 10;

// See if the given text has been encrypted by checking the enc keyword
function isEncryptStr($text)
{
  global $ENC_KEYWORD, $ENC_KEYWORD_LEN;

  $heading = substr($text,0,$ENC_KEYWORD_LEN);
  if ($heading === $ENC_KEYWORD) { return 1; }
  else { return 0; }
}

// Return 1 if the page is a special site page that should not be encrypted.
//        0 otherwise.
// After numerous revision of the pmwiki src code, it turns out "SiteAdmin.Status" is
// the only page that requires this function. Simply the original function to speed up.
function noEncryptPage($pagename)
{
  if (strcasecmp("$pagename","SiteAdmin.Status") == 0) { return 1; }
  else { return 0; }
}

// Derive a key using PBKDF2 with the input $key and $salt. The derived key is used as
// the AES key for later page encryption/decryption.
function derivePageAESKey($key, $salt)
{
  // Derive the encryption key and cache it.
  global $PBKDF2_ITERATION_FOR_AES;
  $iteration = $PBKDF2_ITERATION_FOR_AES;
  $AES_KEY = hash_pbkdf2("sha512", $key, $salt, $iteration, 0, true);

  return $AES_KEY;
}

// Get recently used encryption key by checking the corresponding cache. Return
// Key if found
// empty string otherwise
function getRecentPageAESKey($arrayIndex)
{
  // If the key was recently used and cached, return it directly.
  if (@array_key_exists($arrayIndex, $_SESSION['recentPageAESKey']))
  { return $_SESSION['recentPageAESKey'][$arrayIndex]; }
  else { return ""; }
}

// Cache the recently used encryption key. If the key already exists in the cache, move
// it to the top of the cache. Otherwise insert it at the top of the cache.
function cacheRecentPageAESKey($AES_KEY, $arrayIndex)
{
//   @session_start();
  if (@array_key_exists($arrayIndex, $_SESSION['recentPageAESKey']))
  {
    // Move the key to the top
    $_SESSION['recentPageAESKey'] = array($arrayIndex => $_SESSION['recentPageAESKey'][$arrayIndex]) + $_SESSION['recentPageAESKey'];
  }
  else
  {
    // Cache the key
    $_SESSION['recentPageAESKey'] = (!isset($_SESSION['recentPageAESKey'])) ?
    array($arrayIndex => $AES_KEY) : array($arrayIndex => $AES_KEY) + $_SESSION['recentPageAESKey'];
    global $NUM_RECENTPAGEAESKEY;
    if (count($_SESSION['recentPageAESKey']) > $NUM_RECENTPAGEAESKEY)
    { array_pop($_SESSION['recentPageAESKey']); }
  }
//   @session_write_close();
}

// Get recently decrypted text by checking the corresponding cache. Return
// the decrypted text if found
// empty string otherwise
function getRecentDecryptText($arrayIndex)
{
  if (@array_key_exists($arrayIndex, $_SESSION['recentDecryptText']))
  { return $_SESSION['recentDecryptText'][$arrayIndex]; }

  else { return ""; }
}

// Cache the recently decrypted text for a few special pages that are loaded every time. 
// The special page is identified by finding a corresponding string in the decrypted text.
// If the string is found, which means this is a special page, remove the corresponding 
// entry in the cache if it exists; then put the new item to the top of the cache.
function cacheRecentDecryptText($decryptText, $arrayIndex)
{
  $sitePagename = array("\nname=Main.GroupAttributes\n", "\nname=Site.SideBar\n", "\nname=Site.PageActions\n", "\nname=Site.Editform\n");
  $NUM_SITEPAGE = count($sitePagename);

  for ($i=0;$i<$NUM_SITEPAGE;$i++)
  {
    if (stripos($decryptText, $sitePagename[$i]) !== false)
    {
//       @session_start();

      // Run through the cache to see if the keyword has been registered already, if yes
      // remove the entry
      $textArrayValue = @array_values($_SESSION['recentDecryptText']);
      for ($j=0;$j<count($_SESSION['recentDecryptText']);$j++)
      {
        if (strpos($textArrayValue[$j], $sitePagename[$i]) !== false)
        { unset($_SESSION['recentDecryptText'][ array_search($textArrayValue[$j], $_SESSION['recentDecryptText']) ]); }
      }

      // Put the input decrypted text to the top of the cache.
      $_SESSION['recentDecryptText'] = (!isset($_SESSION['recentDecryptText'])) ?
      array($arrayIndex => $decryptText) : array($arrayIndex => $decryptText) + $_SESSION['recentDecryptText'];
      if (count($_SESSION['recentDecryptText']) > $NUM_SITEPAGE)
      { array_pop($_SESSION['recentDecryptText']); }
//       @session_write_close();

      return true;
    }
  }

  return false;
}

// String encryption. The content of the encrypted string will be preceded by a predefined
// keyword for indicating the fact that it has been encrypted, followed
// by its encryption method, which is hashed, 
// followed by the salt used to generate the encryption key,
// followed by the initialization vector used to generate the encryption key.
// Return
// encrypted text if successfully encrypted;
// false on error, already encrypted, or empty string provided.
function encryptStr($text, $key = "")
{
  if ($text == "") { return false; }

  // If the passphrase for encryption is not provided, get the passphrase from cache,
  // this is the intended operation mode. The cache should be set right after a successful
  // login.
  if ($key == "")
  {
    if (!isset($_SESSION['MASTER_KEY'])) { return false; }
    else { $key = $_SESSION['MASTER_KEY'][0]; }
  }

  // Don't encrypt the text if it's been encrypted already.
  global $ENC_KEYWORD, $ENC_KEYWORD_LEN, $OPENSSL_METHOD;
  if (substr($text,0,$ENC_KEYWORD_LEN) == $ENC_KEYWORD) { return false; }

  // Insert data compression here
//   $text = "GZCOMPRESS\n".gzcompress($text,9);
  $text = "BZCOMPRESS\n".bzcompress($text,9);

  // Generate a random salt for deriving the encryption key and IV
  global $SALT_LEN;
  $salt = openssl_random_pseudo_bytes($SALT_LEN);

  // Derive encryption key based on the salt
  $AES_KEY = derivePageAESKey($key, $salt);

  // Derive IV based on the salt
  global $IV_LEN;
  $iv = openssl_random_pseudo_bytes($IV_LEN);

  $encryptText = openssl_encrypt($text, $OPENSSL_METHOD, $AES_KEY, OPENSSL_RAW_DATA, $iv);
  if ($encryptText === false) { Abort("$pagename encryption error!"); }

  $KEYWORD = $ENC_KEYWORD;
  $cryptMethod = crypt($OPENSSL_METHOD);
  // Base64 encode the output so that we can copy/paste the ciphertext for debugging
  // purpose.
  $encryptText = $KEYWORD."\n".$cryptMethod."\n".base64_encode($salt.$iv.$encryptText);

  // Cache the AES key for quick access later. Using the concatenated string "$key.$salt"
  // as the array index.
  cacheRecentPageAESKey($AES_KEY, $key.$salt);

  return $encryptText;
}

// String decryption. Decrypt the string if the keyword for encryption has been found,
// and the encryption method and passphrase both check. Return
// decrypted text if decrypted
// "$text" if not encrypted, i.e., "$text" is plain text/empty passphrase provided
// 0 if encrypted but empty passphrase provided
// -1 for decryption error, e.g., wrong key or settings
function decryptStr($text, $key = "")
{
  global $ENC_KEYWORD_LEN, $OPENSSL_METHOD;

  // Return the original text if $text is unencrypted
  if (isEncryptStr($text) == false) { return $text; }

  // If the passphrase for encryption is not provided, get the passphrase from cache,
  // this is the intended operation mode. The cache should be set right after a successful
  // login.
  if ($key == "")
  {
    if (!isset($_SESSION['MASTER_KEY'])) { return 0; }
    else { $key = $_SESSION['MASTER_KEY'][0]; }
  }

  $cryptMethodLen = strpos($text,"\n",$ENC_KEYWORD_LEN+1) - $ENC_KEYWORD_LEN - 1; // -1 is for \n
  $cryptMethod = substr($text,$ENC_KEYWORD_LEN+1,$cryptMethodLen);

  // Decrypt the page if the encryption method checks
  if (crypt($OPENSSL_METHOD,$cryptMethod) !== $cryptMethod)
  { echo "$file was encrypted using a different cipher!"; return -1; }

  $text = substr($text,$ENC_KEYWORD_LEN+$cryptMethodLen+2);
  $text = base64_decode($text);

  // Retrieve the salt.
  global $SALT_LEN;
  $salt = substr($text,0,$SALT_LEN);

  // Get the cached recently decrypted text using the salt as the array key.
  // Basically this trades memory off the CPU usage.
  $decryptText = getRecentDecryptText($key.$salt);
  if ($decryptText != "") { return $decryptText; }

  // Retrieve the initialization vector.
  global $IV_LEN;
  $iv = substr($text,$SALT_LEN,$IV_LEN);

  // Derive the encryption key
  // See if the recently used salt equals the retrieved salt
  // If found, use the cached derived key and skip the KDF process
  $AES_KEY = getRecentPageAESKey($key.$salt);
  if ($AES_KEY == "") { $AES_KEY = derivePageAESKey($key, $salt); }

  // Run open ssl decrypt.
  $decryptText = openssl_decrypt(substr($text,$SALT_LEN+$IV_LEN), $OPENSSL_METHOD, $AES_KEY, OPENSSL_RAW_DATA, $iv);
  if ($decryptText === false) { return -1; }

  // Cache the decrypted text for some non-sensitive pmwiki builtin pages for speedup;
  // otherwise record the AES KEY as a recently used one
  if (cacheRecentDecryptText($decryptText, $key.$salt) === true) {}
  else
  { cacheRecentPageAESKey($AES_KEY, $key.$salt); }

  // Insert data decompression here
  if (substr($decryptText,0,10) == 'GZCOMPRESS')
  { $decryptText = gzuncompress(substr($decryptText,11)); }
  else if (substr($decryptText,0,10) == 'BZCOMPRESS')
  { $decryptText = bzdecompress(substr($decryptText,11)); }

  return $decryptText;
}

function passMAC($text, $key)
{
  // Get the MAC part from $text as $MAC

  // Get the cipherTxt part for authentication from $text as $text
  // $hash = hash_hmac(SHA512, $text, $key);

  // Check if they are the same
  // if ($hash === $MAC) { return true; }
  // else { return false; }
}

$HMAC_AUTH = false;
function generate_HMAC_KEY() {}

// Derive the master key used for generating page-specific keys for AES encryption. Use
// PBKDF2 with hardcoded $salt, which in fact doesn't have too much point. 
function deriveMasterKey($passwd)
{
  // Derive MASTER_KEY using pbkdf2
  $salt = hex2bin("a5309a060550d1a3eda6c59264bfd082f584ee113e8276e0eee710868281e979706d4b606bf772b46b31577273706826ca9a214c345ff5561005f3f399084846");
  global $PBKDF2_ITERATION_FOR_MASTER_KEY;
  $iteration = $PBKDF2_ITERATION_FOR_MASTER_KEY;
  $MASTER_KEY = hash_pbkdf2("sha512", $passwd, $salt, $iteration, 0, true);

  return $MASTER_KEY;
}
