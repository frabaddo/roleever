var pauseon="Sessione in pausa, usa /pauseoff per sbloccarla. tutti i messaggi ora saranno bloccati!";
var pauseoff="Sessione uscita dalla pausa!";
var sessionnotstarted= "Questa sessione non è ancora stata avviata, usa il comando /startsession e segui le istruzioni";
var sessionnotcreated= "Questa sessione non è ancora stata creata, usa il comando /startbot e segui le istruzioni";
var start=". /n Io sono il Masterbot, per iniziare a giocare, inseriscimi in un\
supergruppo e controlla che io sia un amministratore. fatto cio segui questi semplici passi (salvo casi esplicitati tutti i comandi sono da immetere nel supergruppo): \
1. crea la sessione inserendo il comando /startbot. \
2. fai in modo che ogni giocatore mi avvii in privato \
3. fai in modo che ogni giocatore inserisca il comando /newusr seguito da pg o master. ricorda che ci può essere un solo master.\
4. avviate la sessione con /startsession. (è sufficiente lo faccia un giocatore solo) \
Ogniqualvolta toccherà a te giocare usa il comando /msg seguito da un testo che racconti le tue gesta. \
se dovessi mai aver bisogno usa il comando /help (in privato) oppure contatta gli sviluppatori sull'apposito gruppo.  \
Buon divertimento!!!";
var bootnogroup="Ciao Sono un bot per giocare ai gdr su dispositivi mobile,\
              per potermi utilizzare inseriscimi prima in un supergruppo e\
              rendimi amministratore";

var botstart="Benvenuto in RoleEver!!! Io sarò il vostro MasterBot da ora in poi.\
                      se dovessi avere bisogno di aiuto usa pure tutti i mei comandi,\
                      e se non li conosci digita /help. Prima di iniziare assicuratevi\
                      che io sia un amministratore del gruppo e controllate di aver tutti\
                      silenziato la chat. durante tutto il gioco sarò sempre io a preoccuparmi\
                      di mandarvi le notifiche. ora oguno di voi digiti il comando /newusr seguito\
                      dal ruolo che svolgerà (master o pg). il resto delle istruzioni vi saranno date\
                      in privato. Buon divertimento!!! ";
var justcreate="Sessione già creata, inserisci giocatori con\
                    /newusr o avvia la sessione con /startsession";



module.exports={
  pauseon,
  pauseoff,
  sessionnotstarted,
  start,
  bootnogroup,
  botstart,
  justcreate
}
