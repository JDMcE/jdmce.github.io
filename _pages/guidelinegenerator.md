---
permalink: /guideline/
title: "Guideline Generator"
tags:
  - guideline
  - guide
  - Calligraphy
---



All sizes are in mm.

Page size: A4
<form>
   <fieldset>
      Ascender <input type="number" id="ascender" value="5">
      x-Height <input type="number" id="xheight" value="10">
      Descender <input type="number" id="descender" value="5">
      Spacing <input type="number" id="spacing" value="2">
      Rows <input type="number" id="rows" value="10">
      Orientation 
      <select name="orientation"  id="orientation">
         <option value="portrait">Portrait</option>
         <option value="landscape">Landscape</option>
      </select><p />
      Draw Slant lines <input type="checkbox" id="drawSlant" name="drawSlant"><p />
      Slant Angle <input type="number" name="slantAngle" id="slantAngle" value="45">
      Slant Spacing <input type="number" id="slantSpacing" value="20">
   </fieldset>
   <input type="button"  class="btn--success" value="Generate" onclick="generate()"><br />
</form>
<canvas id="canvas1" style="background: white;border:1px solid #000000;"></canvas>
<script src="{{ site.url }}{{ site.baseurl }}/assets/guideline/guidelineGenerator.js" type="text/javascript"></script>

