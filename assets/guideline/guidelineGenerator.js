//spacing
//----------------------------
//ascender
//============================
//xheight
//============================
//descender
//----------------------------


const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

//A4 at 96ppi
// canvas.width = 794;
// canvas.height = 1123;

let ppi = 96;
let ppm = ppi / 25.4;


class Line{
	constructor(x1, y1, x2, y2, width, slant = 0){
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.width = width;
		this.slant = slant;
	}

	drawLine() {
		ctx.beginPath();
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x2, this.y2);
		ctx.lineWidth = this.width;
		ctx.stroke();
	}

	drawSlant(){
		ctx.beginPath();
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x1 + (this.x2*2) * Math.cos(Math.PI * this.slant / 180.0),
				   this.y1 + (this.x2*2) * Math.sin(Math.PI * this.slant / 180.0));
		ctx.stroke();
	}

}


function generate(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	let lineArray = [];
	let slantArray =[];
	let rows = document.getElementById("rows").value;
	let x = document.getElementById("xheight").value * ppm;
	let a = document.getElementById("ascender").value * ppm;
	let d = document.getElementById("descender").value * ppm;
	let s = document.getElementById("spacing").value * ppm;
	let r = x + a + d + s;
	let drawSlant = document.getElementById("drawSlant")
	let slantAngle = document.getElementById("slantAngle").value;
	let slantSpacing = document.getElementById("slantSpacing").value;

	console.log(drawSlant);



	let orientation = document.getElementById("orientation").value;
	if (orientation == "portrait"){
		canvas.width = 794;
		canvas.height = 1123;
	} else {
		canvas.width = 1123;
		canvas.height = 794;
	}

	for (let i = 0; i < rows; i++){
		lineArray.push(new Line(0, r*i + s, canvas.width, r*i + s, 1));
		lineArray.push(new Line(0, r*i + s + a, canvas.width, r*i + s + a, 3));
		lineArray.push(new Line(0, r*i + s + a + x, canvas.width, r*i + s + a + x, 3));
		lineArray.push(new Line(0, r*i + s + a + x + d, canvas.width, r*i + s + a + x + d, 1));
	}

	for (var i = 0; i < lineArray.length; i++){
		lineArray[i].drawLine();
	}

	//check for slants
	if(drawSlant.checked){
		for (let i = 0; i < 100; i++){
			slantArray.push(new Line(0, slantSpacing*i, canvas.width, slantSpacing*i, 1, 360 - slantAngle))
		}

		for (var i = 0; i < slantArray.length; i++){
			slantArray[i].drawSlant();
		}
	}

}

