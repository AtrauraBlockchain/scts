var gCtx = null;
var gCanvas = null;
var c = 0;
var stype = 0;
var gUM = false;
var webkit = false;
var moz = false;
var v = null;
var alreadyRead = false;
var rendered = false;

var vidhtml = '<video id="v" autoplay></video>';

function initCanvas(w,h) {
    gCanvas = document.getElementById("qr-canvas");
    gCanvas.style.width = w + "px";
    gCanvas.style.height = h + "px";
    gCanvas.width = w;
    gCanvas.height = h;
    gCtx = gCanvas.getContext("2d");
    gCtx.clearRect(0, 0, w, h);
}

function improveImage(imageData) {
    var data = imageData.data;

    for(var i = 0; i < data.length; i += 4) {

        if(data[i]>100&&data[i+1]>100&&data[i+2]>100){

            data[i]=255 ;
            data[i+1]=255 ;
            data[i+2]=255 ;
        }
        else{
            data[i]=0 ;
            data[i+1]=0 ;
            data[i+2]=0 ;
        }

    }

    return imageData;
}

function captureToCanvas() {
    if(stype!=1)
        return;
    if(gUM) {
        try{
            gCtx.drawImage(v, 0, 0);
            //gCtx.putImageData(improveImage(gCtx.getImageData(0, 0, 640, 480)), 0, 0);
            try{
                qrcode.decode();
            } catch(e) {
                setTimeout(captureToCanvas, 500);
            };
        } catch(e){
                console.log(e);
                setTimeout(captureToCanvas, 500);
        };
    }
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function read(address) {
    processAddress(address);
}

function isCanvasSupported() {
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d'));
}

function success(stream) {
    if(webkit)
        v.src = window.URL.createObjectURL(stream);
    else if(moz) {
        v.mozSrcObject = stream;
        v.play();
    } else v.src = stream;
    gUM=true;
    setTimeout(captureToCanvas, 500);
}

function error(error) {
    gUM=false;
    return;
}

function load(){
	if(isCanvasSupported())	{
		initCanvas(800, 600);
		qrcode.callback = read;
		document.getElementById("mainbody").style.display="inline";
        setwebcam();
	}
}

function setwebcam() {
	var options = true;
	if(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
		try {
			navigator.mediaDevices.enumerateDevices()
			.then(function(devices) {
			  devices.forEach(function(device) {
				if (device.kind === 'videoinput') {
				  if(device.label.toLowerCase().search("back") >-1)
					options={'deviceId': {'exact':device.deviceId}, 'facingMode':'environment'} ;
				}
			  });
			  setwebcam2(options);
			});
		} catch(e) {
			console.log(e);
		}
	}
	else{
		setwebcam2(options);
	}

}

function setwebcam2(options) {
	document.getElementById("result").innerHTML = "- scanning -";

    if(stype == 1) {
        setTimeout(captureToCanvas, 500);
        return;
    }
    var n = navigator;
    document.getElementById("outdiv").innerHTML = vidhtml;
    v = document.getElementById("v");

    if(n.getUserMedia) {
		webkit=true;
        n.getUserMedia({video: options, audio: false}, success, error);
	} else if(n.webkitGetUserMedia) {
        webkit=true;
        n.webkitGetUserMedia({video:options, audio: false}, success, error);
    } else if(n.mozGetUserMedia) {
        moz=true;
        n.mozGetUserMedia({video: options, audio: false}, success, error);
    }

    stype=1;
    setTimeout(captureToCanvas, 500);
}

function processAddress(address){
    if(address.toLowerCase().indexOf("www.l-3jobs.com") != -1){
        $('#results-content').append('<section id="intro" class="container"> \
            <div id="logo-container"></div>\
        </section> \
        <script src="assets/js/bundle.js"></script>');
    }else{
        $('#qr-video').css('display', 'none');
        $('#address_field').css('display', 'none');
        if($('#handler_information').length == 0 && !alreadyRead){
            alreadyRead = true;
            rendered = false;
            async.series([
              function(callback) {
                isProduct(address, function(isProd){
                  if (isProd)  {
                    rendered = true;
                    $('#tracker-content').css('position', 'relative');

                    $('#tracker-content').append('<div class="subway-map" id="subway-map" style="display: table-row-group;" data-columns="4" data-rows="12" data-cellSize="80" data-legendId="legend" data-textClass="text" data-gridNumbers="true" data-grid="false" data-lineWidth="4"></div>');
                    $('#tracker-content').append('<div id="item-list" style="padding-top:40px; margin:0 -20px"></div>')

                    loadContracts();
                    async.series([
                       function(callback) {
                           getProducts(address, function(){callback()});

                       },
                        function(callback) {
                            p=prepareData(address);
                            callback();
                        },
                        function(callback) {
                          console.log("GenerateMap");
                            generateMap(p);
                            callback();
                        },
                        function(callback) {
                          console.log("Subway Map");
                            subwaymap({ debug: true }, $(".subway-map"));
                            callback();
                        }
                    ]);

                    console.log("I'm a product");
                    callback();
                  }
                  else callback();
                });
              },
              function(callback) {
                if (!rendered) {
                  getHandler(address, function(err, res){
                    if (!err) {
                      $('#results-content').append('<div style="margin: 10px;" id="handler_information"> \
                          <h3><strong>HANDLER NAME:</strong> '+res[0]+'</h3> \
                          <a href="https://testnet.etherscan.io/address/'+address+'">See his transactions</a> \
                          </div>');
                    }
                    alreadyRead = false;
                  });
                } else rendered = false;
              }
            ]);
        }
    }
}
