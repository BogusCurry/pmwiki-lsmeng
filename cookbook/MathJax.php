<?php
/*  
Copyright by Ashish Myles 2010.
Copy-paste-modification of Ben Woodruff's jsMath plugin (Copyright 2006)
for PmWiki.

You may use this code as you want, and change it as much as you want.  

MathJax supercedes jsMath and offers new features. For more
details, check out http://www.mathjax.org/ .
The MathJax package itself is available at http://www.mathjax.org/download/ .

In order to use this recipe:

1.  Download and install the MathJax package into your PmWiki's 
    pub/ directory, as pub/MathJax/ .  Or, you can install MathJax
    wherever you wish, and set $MathJaxURL to the url of the MathJax
    directory.
    Unless backward compatibility with old browsers is a must, consider 
    removing the MathJax/fonts/HTML-CSS/TeX/png directory since it has too 
    many files and may slow down the server.

2.  Add the following line to a local customization file:

    include_once("$FarmD/cookbook/MathJax.php");

The script adds {$$ ... $$} and {$...$} markups that
display LaTeX-style math equations, the first form centers the equation, 
while the second generates the equation "inline".

The math graphic for the GUI toolbar is available at
http://www.pmichaud.com/pmwiki/pub/guiedit/math.gif .

The MathJax settings file @@MathJax/config/MathJax.js@@ has many more 
settings to play around with, including setting the HTML tags (e.g. script, 
pre, etc) within which MathJax will not translate the text to mathematics. 
Take a look there.
*/

/*
Modifications by Richard Shaw, 2011.

Added in some rudimentary cross referencing. It is now possible to add
\label{labelname} tags into display equations, which cause the
equation to be numbered, and can then be referenced in the main text
using an \eqref{labelname}. This is best explained with an example.

====

In Equation \eqref{eq:gamma} below I will define a famous special function.

{$$ \label{eq:gamma} \Gamma(z) = \int_0^{\infty} t^{z-1} e^{-t} dt $$}

Equation \eqref{eq:gamma} defines the {$\Gamma$} function, an
extension of the factorial function.

====
*/


SDV($RecipeInfo['Cookbook.MathJax']['Version'], '20110307');

# $MathJaxUrl contains the url to the MathJax directory on the server.
# Defaults to pub/MathJax/ .
SDV($MathJaxUrl, "$PubDirUrl/MathJax");

# The following two lines prevent further processing by PmWiki of the LaTeX 
# equations within {$ $} and {$$ $$}.
Markup('{$', '>[=', '/\\{\\$(.*?)\\$\\}/e', "Keep('{\$'.PSS('$1').'\$}')");
Markup('{$$', '<{$', '/\\{\\$\\$(.*?)\\$\$\\}/se', "ProcessLatexEquation(PSS('$1'))");

# PmWiki rule for processing eqrefs.
Markup('latexeqref', '>{$$', '/\\\\eqref\\{([^\\}]+)\\}/e', "ProcessEqref('$1')");


$HTMLHeaderFmt['MathJax'] = '<script type="text/javascript" src="$MathJaxUrl/MathJax.js"></script>';
$HTMLHeaderFmt['MathJax'] = '<script type="text/javascript" src="$MathJaxUrl/MathJax.js">MathJax.Hub.Config({
    extensions: ["tex2jax.js","TeX/AMSmath.js","TeX/AMSsymbols.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: { inlineMath: [ [\'{\$\',\'\$}\'] ], displayMath: [ [\'{\$\$\',\'\$\$}\'] ] } });</script>';

# The graphic is available from 
# http://www.pmichaud.com/pmwiki/pub/guiedit/math.gif .
SDV($GUIButtons['math'],array(1000, '{$ ', ' $}', '\\\\sqrt{n}', 
  '$GUIButtonDirUrlFmt/math.gif"$[Math formula (LaTeX/MimeTeX)]"'));


# The map from reference name to the equation number.
$mathjax_refarray = array();
# The current highest equation number.
$mathjax_cur_ref = 1;


# Process Latex DisplayEquations
#
# This handles equation cross-referencing, by extracting \labels and
# inserting \tag's for explicit numbering. MathJax will only handle
# one tag per equation, so this assign's the same number to all labels.
function ProcessLatexEquation($equation) {

  global $mathjax_refarray, $mathjax_cur_ref;

  # Find all \label tags (especially the label names).
  preg_match_all('/\\\\label\\{(.*?)\\}/', $equation, $labelarray);
  # Remove all labels from the equation source.
  $eq = preg_replace('/\\\\label\\{.*?\\}/', '', $equation);

  # Store the equation number corresponding to every label.
  foreach ($labelarray[1] as $label) {
    $mathjax_refarray[$label] = $mathjax_cur_ref;
  }

  # Write out final equation source (including a single \tag, and html
  # anchor to it, if there were any labels found).
  if(count($labelarray[1]) == 0) {
    $retstr = Keep('{$$'.$eq.'$$}');
  }
  else { 
    $retstr = '[[#tag'.$mathjax_cur_ref.']]'.Keep('{$$ \\tag{'.$mathjax_cur_ref.'}'.$eq.'$$}');
    $mathjax_cur_ref += 1;
  }
  return $retstr;

}


# Process \eqref's. This looks up the label to fetch the equation
# number, and returns the formatted number, with a link to the actual
# equation.
function ProcessEqref($label) {
  global $mathjax_refarray;

  if(array_key_exists($label, $mathjax_refarray)) {
    $tagnum = $mathjax_refarray[$label];
    return '([[#tag'.$tagnum.'|'.$tagnum.']])';
  }
  else {
    return '(label '.$label.' undefined)';
  }
}

