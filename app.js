const express = require('express');
const app = express();
const server = require('http').createServer(app);
const readline = require("readline");
const fs = require("fs");

// README README README README README README README README README README README README  //
//            Ne pas oublier de modifier adresse IP et les chemins necessaire           //
// README README README README README README README README README README README README  //

// ------------------------------------------------------------- R O U T E S  -------------------------------------------------------------
app.use(express.static(__dirname + '/public'));

// Chargement de la page index (Sciences Participatives)
app.get('/', function (req, res) {
  res.render('index.ejs');
});

app.get('/TravauxPratiques', function (req, res) {
  const folderSG = 'public/download/sg2/';
  const folderLVM = 'public/download/labview/';
  var filesSG = fs.readdirSync(folderSG);
  var filesLVM = fs.readdirSync(folderLVM);

  res.render('tp.ejs', {
       filesSG: filesSG,
       filesLVM: filesLVM
  });

});

// ... Tout le code de gestion des routes (app.get) se trouvera ici

// Not found.. Erreur 404
app.use(function(req, res, next){
     res.status(404).render('404.ejs');
});

console.log("Serveur OK ! PORT: 8080");



// ------------------------------------------------------------- Johnny five  -------------------------------------------------------------
/*
//Module pour le bon fonctionnement de ce code
const five = require("johnny-five");

//Communication avec la carte Arduino en USB
var board = new five.Board()

board.on("ready", function(){
	var sensor = new five.Sensor({
		pin: "A0",
		freq: 33
	})

	sensor.on("data", function(){
    //Ajout de la nouvelle donnée dans le fichier input (data.txt) avec un saut à la ligne
		fs.appendFile('data.txt',  + sensor + "\n", function (err) {
  			if (err) throw err;
  			console.log("Enregistrement d'une nouvelle ligne !");
			});
	})
})

*/
// ------------------------------------------------------------- S O C K E T IO  -------------------------------------------------------------
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {

    // ------------------------------------------------------------- SplitData -------------------------------------------------------------


    socket.on('SplitData', function (requete) {
        console.log('Client : ' + requete);

        console.log("Serveur : [CreateFile/Header] Fonction en cours...");
        socket.emit('message_sg', 'Chargement...');

        socket.on('gps', function (gps) {
          console.log(gps);
        });

        const rl = readline.createInterface({
            input: fs.createReadStream("./data.txt")
        });

        var lineCount = 0;
        var fileCount = 0;
        var lineCountL = 0;
        var fileCountL = 0;

        const SPLIT_INCREMENT = 9000;

        var filename;
        var filenameL;

        var header = "SG2K_ASCII  event=FRANCE year=2018 jday=258 hour=6 min=10 sec=26.0 begTime=3.0E-4 network=ED sta=ACDF inst=NOEMAX chan=BHE loc=00 comp=X comp.az=90.0 comp.inc=90.0  sta.lat=44.926  sta.lon=2.44  sta.depth=Infinity  sta.elev=0.64  gain=3.36E9 nPoints=561251 sampleInt=0.02  ampUnits=mm/s timeUnits=sec hypo.lat=28.28 hypo.lon=84.79 hypo.depth=Infinity hypo.otime=2015,04,25,06,11,26.0 hypo.ms=-9.9 hypo.mb=-9.9 hypo.mw=7.8 hypo.ml=-9.9 hypo.mo=-9.9 hypo.mag=7.8 gcarc=65.31789 dist=7271.157 az=284.76447 baz=104.76446";
        var footer = "END_SG2K_ASCII";



        var contenu = fs.readFileSync("entete_lvm.txt", "UTF-8");
        var headerL = contenu;
        var footerL = "";


        rl.on("line", function(line) {

            var createDate = new Date();
            var title_date = createDate.getDate() + "_" + createDate.getMonth() + "_" + createDate.getFullYear() + "_" + createDate.getHours() + "_" + createDate.getMinutes() + "_" + createDate.getSeconds();

            filename = "sensor_" + title_date + ".sg2";
            filenameL = "sensor_" + title_date + ".lvm";

            fs.appendFileSync(filename, line + "\n");
            fs.appendFileSync(filenameL, line + "\n");

            lineCount++;
            lineCountL++;

            if(lineCount % SPLIT_INCREMENT === 0) {
                console.log("Le fichier : " + filename + " a été créé");
                socket.emit('message_sg', 'Création du fichier  ' + filename + '...');

                writeFileWithMeta(header, footer, filename);

                fileCount++;
            }

            if(lineCountL % SPLIT_INCREMENT === 0) {
                console.log("Le fichier : " + filenameL + " a été créé");
                socket.emit('message_lvm', 'Création du fichier  ' + filenameL + '...');

                writeFileWithMetaL(headerL, footerL, filenameL);

                fileCountL++;
            }

        });


      function writeFileWithMeta(header, footer, file) {

          if(!fs.existsSync(file)) {
            console.log("Le fichier data.txt est vide")
            socket.emit('erreur', 'Aucune données reçues...');
            return;
          }

		        socket.emit('erreur', '');

            var content = fs.readFileSync(file);
            content = header + "\n" + content + footer + "\n";

            fs.writeFile(file, content, "utf-8", (err) => {
                if(err) {
                    console.error(err);
                    return;
                }

                console.log("Ajout de l'en-tête au fichier : " + file);
            });
//MODIFIER CHEMIN
            fs.rename('C:/Users/Aurélien/Desktop/myapp/'+filename, 'C:/Users/Aurélien/Desktop/myapp/public/download/sg2/'+filename, function (err) {
              if (err) throw err;
              console.log('Deplacement de sg2 '+filename);
            });

}




        function writeFileWithMetaL(headerL, footerL, fileL) {

          if(!fs.existsSync(fileL)) {
            console.log("Le fichier data.txt est vide")
            socket.emit('erreur', 'Aucunes données reçues...');
            return;
          }

            socket.emit('erreur', '');

            var content = fs.readFileSync(fileL);
            content = headerL + "\n" + content + footerL + "\n";

            fs.writeFile(fileL, content, "utf-8", (err) => {
                if(err) {
                    console.error(err);
                    return;
                }

                console.log("Ajout de l'en-tête au fichier : " + fileL);
            });
//MODIFIER CHEMIN
            fs.rename('C:/Users/Aurélien/Desktop/myapp/'+filenameL, 'C:/Users/Aurélien/Desktop/myapp/public/download/labview/'+filenameL, function (err) {
              if (err) throw err;
              console.log('Deplacement de lvm '+filenameL);
            });

        }




        rl.on("close", () => {

          var createDate = new Date();
          var title_date = createDate.getDate() + "_" + createDate.getMonth() + "_" + createDate.getFullYear() + "_" + createDate.getHours() + "_" + createDate.getMinutes() + "_" + createDate.getSeconds();

            writeFileWithMeta(header, footer, "sensor_" + title_date + ".sg2");
            writeFileWithMetaL(headerL, footerL, "sensor_" + title_date + ".lvm");


                    fs.writeFile("./data.txt", "", () => {
                        console.log("Le fichier data.txt a été vidé");
                        socket.emit('message_sg', 'Terminé');
                        socket.emit('message_lvm', 'Terminé');
                    });

        });



      });


});



// ------------------------------------------------------------- L I S T E N -------------------------------------------------------------

//ecouter le port 8080
server.listen(8080);
