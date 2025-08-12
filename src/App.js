import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, set, onValue, push, remove } from 'firebase/database';

const TrainingBoardGame = () => {
  const [gameState, setGameState] = useState('setup');
  const [gameId, setGameId] = useState('');
  const [currentTeam, setCurrentTeam] = useState(0);
  const [teams, setTeams] = useState([
    { name: 'Team Blauw', position: 0, color: 'bg-blue-500', connected: false },
    { name: 'Team Rood', position: 0, color: 'bg-red-500', connected: false },
    { name: 'Team Groen', position: 0, color: 'bg-green-500', connected: false },
    { name: 'Team Geel', position: 0, color: 'bg-yellow-500', connected: false }
  ]);
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [boardSize, setBoardSize] = useState(15);
  const [currentBet, setCurrentBet] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isGameMaster, setIsGameMaster] = useState(true);
  const [playerTeam, setPlayerTeam] = useState(null);
  const [isJoinMode, setIsJoinMode] = useState(false);

  const availablePresets = {
    'Gesprekken - Stevige START methode': {
      knowledge: {
        easy: ['Wat betekent de \'S\' in de Stevige START methode?'],
        medium: ['Je bent in gesprek met nieuwe ouders. Welke START-component pas je toe als je vraagt: \'Wat verwachten jullie eigenlijk van ons?\''],
        hard: ['Geef in 5-10 zinnen aan hoe je de meldcode aan ouders uitlegt.']
      },
      pictionary: { easy: ['Samenwerking'], medium: ['Transparantie'], hard: ['Zorgsignalen'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij een goede start van een gesprek'], 
        medium: ['Noem woorden die horen bij het opbouwen van vertrouwen'], 
        hard: ['Noem woorden die horen bij professionele samenwerking'] 
      }
    },
    'Gesprekken - Cirkel van Gedragsverandering': {
      knowledge: {
        easy: ['In welke fase zitten ouders die zeggen: \'Er is niks aan de hand met ons kind\'?'],
        medium: ['Ouders zeggen: \'We twijfelen of logopedie wel nodig is, maar misschien helpt het.\' In welke fase zitten zij?'],
        hard: ['Hoe reageer je als ouders in de voorbeschouwingsfase zitten maar jij ziet urgente zorgen?']
      },
      pictionary: { easy: ['Motivatie'], medium: ['Weerstand'], hard: ['Voorbeschouwing'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij motivatie en verandering'], 
        medium: ['Noem woorden die horen bij weerstand begrijpen'], 
        hard: ['Noem woorden die horen bij gedragsverandering begeleiden'] 
      }
    },
    'Gesprekken - Mentaliseren in Oudergesprekken': {
      knowledge: {
        easy: ['Mentaliseren betekent dat je probeert te begrijpen wat er in de ander omgaat. Geef een vraag die helpt om te mentaliseren over het kind.'],
        medium: ['Wanneer staat het vermogen om te mentaliseren onder druk?'],
        hard: ['Een ouder reageert boos als je zorgen deelt. Hoe gebruik je mentaliseren om het gesprek constructief te houden?']
      },
      pictionary: { easy: ['Perspectief'], medium: ['Kindperspectief'], hard: ['Mentaliseren'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij begripvol luisteren'], 
        medium: ['Noem woorden die horen bij perspectieven begrijpen'], 
        hard: ['Noem woorden die horen bij mentaliseren in gesprekken'] 
      }
    },
    'Gesprekken - Omgaan met Weerstand': {
      knowledge: {
        easy: ['Waarom ontstaat er vaak weerstand bij ouders tijdens zorggesprekken?'],
        medium: ['Een ouder zegt: \'Jullie zien overal problemen!\' Hoe reageer je hierop?'],
        hard: ['Wat bedoelen we met de \'onzichtbare rugzak\' van ouders en hoe beïnvloedt dit hun reacties?']
      },
      pictionary: { easy: ['Weerstand'], medium: ['Angst'], hard: ['Onzichtbare rugzak'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij weerstand begrijpen'], 
        medium: ['Noem woorden die horen bij angsten van ouders'], 
        hard: ['Noem woorden die horen bij eerdere ervaringen'] 
      }
    },
    'Gesprekken - Feitelijk Communiceren en Voorbeelden Geven': {
      knowledge: {
        easy: ['Wat is het verschil tussen \'Lisa is druk\' en \'Lisa stond gisteren 4 keer op tijdens het voorlezen\'?'],
        medium: ['Waarom is het belangrijk om concrete voorbeelden te geven bij je zorgen?'],
        hard: ['Herformuleer deze zin feitelijk: \'Kevin is agressief naar andere kinderen.\'']
      },
      pictionary: { easy: ['Feitelijk'], medium: ['Observatie'], hard: ['Interpretatie'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij concrete communicatie'], 
        medium: ['Noem woorden die horen bij observeren van gedrag'], 
        hard: ['Noem woorden die horen bij objectief beschrijven'] 
      }
    },
    'Gesprekken - Culturele Sensitiviteit en Diversiteit': {
      knowledge: {
        easy: ['Wat houdt een lerende houding in bij culturele sensitiviteit?'],
        medium: ['Een ouder met een andere culturele achtergrond reageert anders dan je verwacht. Wat doe je?'],
        hard: ['Noem 3 concrete vragen waarmee je cultuurspecifieke informatie kunt verzamelen zonder in stereotypen te vervallen.']
      },
      pictionary: { easy: ['Diversiteit'], medium: ['Vooroordelen'], hard: ['Lerende houding'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij respect voor verschillen'], 
        medium: ['Noem woorden die horen bij culturele diversiteit'], 
        hard: ['Noem woorden die horen bij lerende houding'] 
      }
    },
    'Gesprekken - Life-events en Contextfactoren': {
      knowledge: {
        easy: ['Waarom is het belangrijk om te vragen naar belangrijke gebeurtenissen in het leven van een kind?'],
        medium: ['Noem 5 voorbeelden van life-events die het gedrag van een kind kunnen beïnvloeden.'],
        hard: ['Een kind vertoont sinds 2 maanden ander gedrag. Welke vervolgvragen stel je over timing en context?']
      },
      pictionary: { easy: ['Verandering'], medium: ['Context'], hard: ['Life-events'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij belangrijke gebeurtenissen'], 
        medium: ['Noem woorden die horen bij veranderingen in het gezin'], 
        hard: ['Noem woorden die horen bij contextfactoren'] 
      }
    },
    'Gesprekken - Gesprek met Beide Ouders en Gescheiden Ouders': {
      knowledge: {
        easy: ['Waarom is het belangrijk om met beide ouders te praten, ook als je er een weinig ziet?'],
        medium: ['Ouders hebben verschillende meningen over de zorgen. Hoe ga je hiermee om?'],
        hard: ['Bij gescheiden ouders zijn de gesprekken te gespannen om samen te doen. Wat zijn de belangrijkste aandachtspunten bij aparte gesprekken?']
      },
      pictionary: { easy: ['Beide ouders'], medium: ['Verschillende perspectieven'], hard: ['Neutraliteit'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij samenwerking met ouders'], 
        medium: ['Noem woorden die horen bij gescheiden ouders'], 
        hard: ['Noem woorden die horen bij neutraliteit bewaren'] 
      }
    },
'Gesprekken - Stress en Impact op Communicatie': {
      knowledge: {
        easy: ['Noem 3 effecten van stress op communicatie.'],
        medium: ['Je merkt dat ouders gestrest zijn tijdens het gesprek. Hoe pas je je communicatie hierop aan?'],
        hard: ['Wat kun je doen om je eigen stress tijdens een gesprek te managen?']
      },
      pictionary: { easy: ['Stress'], medium: ['Tunnelvisie'], hard: ['Informatie doseren'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij stress herkennen'], 
        medium: ['Noem woorden die horen bij stress effecten'], 
        hard: ['Noem woorden die horen bij stress management'] 
      }
    },
    'Gesprekken - Gesprek Voorbereiden en Structureren': {
      knowledge: {
        easy: ['Waarom voer je zorggesprekken altijd met z\'n tweeën?'],
        medium: ['Wat zijn de belangrijkste praktische voorbereidingspunten voor een zorggesprek?'],
        hard: ['Je hebt je gesprek voorbereid, maar ouders komen met heel andere informatie dan verwacht. Hoe ga je hiermee om?']
      },
      pictionary: { easy: ['Voorbereiding'], medium: ['Rolverdeling'], hard: ['Gespreksleider'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij gesprek voorbereiden'], 
        medium: ['Noem woorden die horen bij rolverdeling'], 
        hard: ['Noem woorden die horen bij flexibel blijven'] 
      }
    },
    'Gesprekken - Afsluiten en Vervolgafspraken': {
      knowledge: {
        easy: ['Waarom maak je altijd een vervolgafspraak, ook als ouders \'het even willen aankijken\'?'],
        medium: ['Hoe sluit je een zorggesprek goed af?'],
        hard: ['Een gesprek is goed verlopen en er zijn afspraken gemaakt. Welke elementen documenteer je?']
      },
      pictionary: { easy: ['Samenvatting'], medium: ['Vervolgafspraak'], hard: ['Concrete afspraken'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij gesprekken afsluiten'], 
        medium: ['Noem woorden die horen bij vervolgafspraken'], 
        hard: ['Noem woorden die horen bij documentatie'] 
      }
    },
    'Gesprekken - Escalatie Voorkomen en Hanteren': {
      knowledge: {
        easy: ['Noem 3 vroege signalen van escalatie tijdens een gesprek.'],
        medium: ['Leg de \'Kan niet, wil wel, moet anders\' formule uit en geef een voorbeeld.'],
        hard: ['Wanneer beëindig je een gesprek en hoe doe je dat veilig?']
      },
      pictionary: { easy: ['Escalatie'], medium: ['Grenzen stellen'], hard: ['Veiligheid'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij escalatie voorkomen'], 
        medium: ['Noem woorden die horen bij de-escalatie'], 
        hard: ['Noem woorden die horen bij veiligheid'] 
      }
    },
    'Gesprekken - Actief Luisteren en Doorvragen': {
      knowledge: {
        easy: ['Waarom is de techniek van \'laatste woorden herhalen op vragende toon\' zo belangrijk?'],
        medium: ['Wanneer mag je altijd doorvragen naar persoonlijke informatie van ouders?'],
        hard: ['Waarom is het KD\'tje (Kou De bek houden) zo belangrijk na het stellen van een vraag?']
      },
      pictionary: { easy: ['Actief luisteren'], medium: ['Doorvragen'], hard: ['Stilte'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij actief luisteren'], 
        medium: ['Noem woorden die horen bij doorvragen'], 
        hard: ['Noem woorden die horen bij stilte gebruiken'] 
      }
    },
    'Gesprekken - Ouders Uitnodigen voor Zorggesprek': {
      knowledge: {
        easy: ['Wanneer nodig je ouders uit voor een zorggesprek?'],
        medium: ['Wat zeg je wel en wat zeg je niet bij het uitnodigen?'],
        hard: ['Ouders beginnen direct vragen te stellen bij de uitnodiging. Hoe reageer je?']
      },
      pictionary: { easy: ['Uitnodigen'], medium: ['Zorggesprek'], hard: ['Beide ouders'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij ouders uitnodigen'], 
        medium: ['Noem woorden die horen bij zorggesprekken'], 
        hard: ['Noem woorden die horen bij grenzen stellen'] 
      }
    },
    'Gesprekken - Vervolgzorggesprekken en Voortgang Bespreken': {
      knowledge: {
        easy: ['Wat is het belangrijkste verschil tussen een eerste zorggesprek en een vervolgzorggesprek?'],
        medium: ['Hoe bespreek je voortgang in een vervolgzorggesprek?'],
        hard: ['Er is geen nieuwe informatie van ouders en geen gedeelde visie, maar zorgen zijn wel urgent. Welke route volg je?']
      },
      pictionary: { easy: ['Voortgang'], medium: ['Evaluatie'], hard: ['Vervolgzorggesprek'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij voortgang bespreken'], 
        medium: ['Noem woorden die horen bij evalueren'], 
        hard: ['Noem woorden die horen bij vervolgtrajecten'] 
      }
    },
    'Gesprekken - De Mens Achter de Methode': {
      knowledge: {
        easy: ['Wat betekent \'de mens achter de methode\' bij zorggesprekken?'],
        medium: ['Hoe voorkom je dat een gesprek voelt als \'een afvinklijst afwerken\'?'],
        hard: ['Waarom is professionele nabijheid belangrijk en hoe toon je dit?']
      },
      pictionary: { easy: ['Oprechte interesse'], medium: ['Professionele nabijheid'], hard: ['Mens zijn'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij oprechte interesse'], 
        medium: ['Noem woorden die horen bij professionele nabijheid'], 
        hard: ['Noem woorden die horen bij echt contact maken'] 
      }
    },
    'Gesprekken - Struikelblokken Voorkomen': {
      knowledge: {
        easy: ['Waarom is het belangrijk om zorgen niet te lang op te sparen?'],
        medium: ['Wat is het gevaar van \'verschillende verhalen vertellen\' in het team?'],
        hard: ['Hoe voorkom je onduidelijke verwachtingen bij ouders?']
      },
      pictionary: { easy: ['Struikelblokken'], medium: ['Verwachtingen'], hard: ['Tegenstrijdige berichten'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij struikelblokken vermijden'], 
        medium: ['Noem woorden die horen bij verwachtingen managen'], 
        hard: ['Noem woorden die horen bij team afstemming'] 
      }
    },
    'Gesprekken - Het Vinden van de Juiste Ingang': {
      knowledge: {
        easy: ['Waarom zijn niet alle zorgen even makkelijk te bespreken?'],
        medium: ['Hoe kan het helpen om een collega het gesprek te laten voeren die beter \'klikt\' met ouders?'],
        hard: ['Ouders zitten per onderwerp in verschillende fases. Hoe ga je hiermee om?']
      },
      pictionary: { easy: ['Ingang vinden'], medium: ['Klik'], hard: ['Verschillende fases'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij aansluiting vinden'], 
        medium: ['Noem woorden die horen bij verschillende perspectieven'], 
        hard: ['Noem woorden die horen bij de juiste timing'] 
      }
    },
    'Gesprekken - Doelstelling bij Eerste Zorggesprekken': {
      knowledge: {
        easy: ['Wat zijn de twee hoofddoelen van een eerste zorggesprek?'],
        medium: ['Waarom is \'informatie verzamelen\' minstens zo belangrijk als \'zorgen delen\'?'],
        hard: ['Wat is het gevaar van te veel in één eerste gesprek willen stoppen?']
      },
      pictionary: { easy: ['Doelstelling'], medium: ['Informatie verzamelen'], hard: ['Focus'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij gespreksdoelen'], 
        medium: ['Noem woorden die horen bij informatie verzamelen'], 
        hard: ['Noem woorden die horen bij focus bewaren'] 
      }
    },
    'Gesprekken - De Zelfdeterminatietheorie': {
      knowledge: {
        easy: ['Wat zijn de drie basisbehoeften volgens de zelfdeterminatietheorie?'],
        medium: ['Wanneer ontstaat weerstand bij ouders volgens deze theorie?'],
        hard: ['Hoe kun je deze drie basisbehoeften ondersteunen tijdens zorggesprekken?']
      },
      pictionary: { easy: ['Autonomie'], medium: ['Competentie'], hard: ['Zelfdeterminatietheorie'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij autonomie'], 
        medium: ['Noem woorden die horen bij competentie en verbondenheid'], 
        hard: ['Noem woorden die horen bij zelfdeterminatietheorie'] 
      }
    },
'Gedrag - Het Competentiemodel (Slot & Spanjaard)': {
      knowledge: {
        easy: ['Wat zijn de twee kanten van de weegschaal in het competentiemodel?'],
        medium: ['Een kind bijt regelmatig andere kinderen. Hoe gebruik je het competentiemodel om dit gedrag te begrijpen?'],
        hard: ['Geef vijf deeltaken bij de volgende overkoepelende taak: Memory met een ander kind.']
      },
      pictionary: { easy: ['Weegschaal'], medium: ['Kindfactoren'], hard: ['Omgevingsfactoren'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij balans in vaardigheden'], 
        medium: ['Noem woorden die horen bij kind- en omgevingsfactoren'], 
        hard: ['Noem woorden die horen bij het competentiemodel'] 
      }
    },
    'Gedrag - Scaffolding en Vaardigheden Opbouwen': {
      knowledge: {
        easy: ['Wat betekent scaffolding letterlijk en figuurlijk?'],
        medium: ['Noem 4 verschillende scaffolding-technieken die je kunt gebruiken bij gedragsproblemen.'],
        hard: ['Wanneer en hoe bouw je scaffolding af bij het aanleren van sociaal gedrag?']
      },
      pictionary: { easy: ['Scaffolding'], medium: ['Prompting'], hard: ['Modeling'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij ondersteuning bieden'], 
        medium: ['Noem woorden die horen bij scaffolding technieken'], 
        hard: ['Noem woorden die horen bij vaardigheden opbouwen'] 
      }
    },
    'Gedrag - Mentaliseren en Most Generous Interpretation': {
      knowledge: {
        easy: ['Wat betekent mentaliseren bij gedragsproblemen?'],
        medium: ['Wat is \'most generous interpretation\' en waarom werkt dit?'],
        hard: ['Noem de 5 vragen die je jezelf kunt stellen bij lastig gedrag.']
      },
      pictionary: { easy: ['Mentaliseren'], medium: ['Nieuwsgierigheid'], hard: ['Most generous interpretation'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij gedrag begrijpen'], 
        medium: ['Noem woorden die horen bij nieuwsgierig blijven'], 
        hard: ['Noem woorden die horen bij mild interpreteren'] 
      }
    },
    'Gedrag - Emotieregulatie en de Emotiethermometer': {
      knowledge: {
        easy: ['Wat zijn de vier stappen bij een emotie-explosie?'],
        medium: ['Waarom praat je niet in de piek van de emotie met een kind?'],
        hard: ['Hoe werk je met een emotiethermometer en waarom is dit effectief?']
      },
      pictionary: { easy: ['Emotiethermometer'], medium: ['Pre-teaching'], hard: ['Afleiden'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij emoties reguleren'], 
        medium: ['Noem woorden die horen bij emotiethermometer'], 
        hard: ['Noem woorden die horen bij stress management'] 
      }
    },
    'Gedrag - Positieve Bekrachtiging en Relatie Opbouwen': {
      knowledge: {
        easy: ['Wat zijn de drie niveaus van complimenten?'],
        medium: ['Hoe versterk je de band met een kind dat gedragsproblemen heeft?'],
        hard: ['Waarom werken complimenten op proces beter dan op resultaat of eigenschap?']
      },
      pictionary: { easy: ['Positieve bekrachtiging'], medium: ['Autonomie'], hard: ['Leefwereld'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij positieve bekrachtiging'], 
        medium: ['Noem woorden die horen bij relatie opbouwen'], 
        hard: ['Noem woorden die horen bij intrinsieke motivatie'] 
      }
    },
    'Gedrag - Context en Omgevingsfactoren': {
      knowledge: {
        easy: ['Waarom heeft de thuissituatie altijd invloed op gedrag van kinderen op de opvang?'],
        medium: ['Wat zijn ACE\'s en hoe kunnen deze het gedrag van kinderen beïnvloeden?'],
        hard: ['Leg het geboortemaandeffect uit en geef een praktijkvoorbeeld.']
      },
      pictionary: { easy: ['Context'], medium: ['ACEs'], hard: ['Geboortemaandeffect'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij context begrijpen'], 
        medium: ['Noem woorden die horen bij jeugdervaringen'], 
        hard: ['Noem woorden die horen bij ontwikkelingsverschillen'] 
      }
    },
    'Gedrag - Fogg Behavior Model': {
      knowledge: {
        easy: ['Wat zijn de drie elementen die nodig zijn voor gedrag volgens het Fogg Behavior Model?'],
        medium: ['Een kind kan wel \'stop\' zeggen maar doet het niet in een lastige situatie. Welk element van het Fogg model ontbreekt waarschijnlijk?'],
        hard: ['Hoe pas je het Fogg Behavior Model toe om een kind te leren delen tijdens het spelen?']
      },
      pictionary: { easy: ['Motivatie'], medium: ['Vermogen'], hard: ['Prompt'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij gedragsverandering'], 
        medium: ['Noem woorden die horen bij het Fogg model'], 
        hard: ['Noem woorden die horen bij gedrag aanleren'] 
      }
    },
    'Gedrag - De Shift van "Wat is er mis?" naar "Wat heb je nodig?"': {
      knowledge: {
        easy: ['Wat is het verschil tussen \'Wat is er mis?\' en \'Wat heb je nodig?\' denken?'],
        medium: ['Een kind bijt regelmatig andere kinderen. Hoe pas je de shift toe van probleem naar behoefte?'],
        hard: ['Waarom is van verklaren naar begrijpen een belangrijke shift bij gedragsproblemen?']
      },
      pictionary: { easy: ['Behoeftegericht'], medium: ['Communicatie'], hard: ['Signaal'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij behoeften herkennen'], 
        medium: ['Noem woorden die horen bij de shift in denken'], 
        hard: ['Noem woorden die horen bij gedrag als boodschap'] 
      }
    },
    'Gedrag - KindKernKaarten en Leeftijdsfases': {
      knowledge: {
        easy: ['Voor welke drie leeftijdsgroepen zijn er KindKernKaarten?'],
        medium: ['Noem 3 componenten van de KindKernKaart voor 4-7 jaar.'],
        hard: ['Op welke drie niveaus kun je de KindKernKaarten toepassen?']
      },
      pictionary: { easy: ['KindKernKaart'], medium: ['Componenten'], hard: ['Leeftijdsfases'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij KindKernKaarten'], 
        medium: ['Noem woorden die horen bij leeftijdsfases'], 
        hard: ['Noem woorden die horen bij handelingsgericht denken'] 
      }
    },
    'Gedrag - Zelfzorg en Stress Management voor Professionals': {
      knowledge: {
        easy: ['Waarom is zelfzorg belangrijk bij het begeleiden van kinderen met gedragsproblemen?'],
        medium: ['Hoe beïnvloedt stress je vermogen om te mentaliseren bij lastig gedrag?'],
        hard: ['Wat kun je doen als je merkt dat je zelf te gestresst bent om goed te begeleiden?']
      },
      pictionary: { easy: ['Zelfzorg'], medium: ['Stress'], hard: ['Grenzen'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij zelfzorg'], 
        medium: ['Noem woorden die horen bij stress herkennen'], 
        hard: ['Noem woorden die horen bij professionele grenzen'] 
      }
    },
    'Gedrag - Dagprogramma Aanpassen en Omgeving Inrichten': {
      knowledge: {
        easy: ['Waarom is het dagprogramma een onderschat middel om rust te brengen in de groep?'],
        medium: ['Wat is situatie-modificatie en hoe gebruik je het bij gedragsproblemen?'],
        hard: ['Hoe pas je een dagprogramma aan voor een groep met veel kinderen die beweging nodig hebben?']
      },
      pictionary: { easy: ['Dagprogramma'], medium: ['Situatie-modificatie'], hard: ['Omgeving'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij dagprogramma aanpassen'], 
        medium: ['Noem woorden die horen bij situatie-modificatie'], 
        hard: ['Noem woorden die horen bij preventief werken'] 
      }
    },
    'Gedrag - Wat Je NIET Moet Doen en Veelgemaakte Fouten': {
      knowledge: {
        easy: ['Waarom werkt \'doe eens rustig\' zeggen niet bij kinderen met gedragsproblemen?'],
        medium: ['Wat is er mis met de waaromvraag bij gedragsproblemen?'],
        hard: ['Wanneer mag je fysiek begrenzen en hoe doe je dat verantwoord?']
      },
      pictionary: { easy: ['Waaromvraag'], medium: ['Schreeuwen'], hard: ['Alternatieven'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij wat NIET te doen'], 
        medium: ['Noem woorden die horen bij veelgemaakte fouten'], 
        hard: ['Noem woorden die horen bij verantwoord begrenzen'] 
      }
    },
    'Gedrag - Beweging en Zintuiglijke Strategieën': {
      knowledge: {
        easy: ['Waarom helpt beweging bij kinderen met grote emoties?'],
        medium: ['Wat is self-generated optic flow en hoe helpt dit bij emotieregulatie?'],
        hard: ['Noem 5 verschillende bewegings- of zintuiglijke activiteiten die je kunt inzetten bij emotieregulatie.']
      },
      pictionary: { easy: ['Beweging'], medium: ['Zintuiglijk'], hard: ['Emotieregulatie'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij beweging en emoties'], 
        medium: ['Noem woorden die horen bij zintuiglijke strategieën'], 
        hard: ['Noem woorden die horen bij bewegingsregulatie'] 
      }
    },
    'Gedrag - Uit de Situatie Halen en Time-in': {
      knowledge: {
        easy: ['Wat is het verschil tussen time-out en time-in?'],
        medium: ['Welke signalen kun je herkennen voordat een kind escaleert?'],
        hard: ['Waarom is pre-teaching belangrijk na het uit de situatie halen?']
      },
      pictionary: { easy: ['Time-in'], medium: ['Vroege signalen'], hard: ['Preventief'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij time-in'], 
        medium: ['Noem woorden die horen bij vroege signalen'], 
        hard: ['Noem woorden die horen bij preventief handelen'] 
      }
    },
    'Gedrag - Ademhaling en Ontspanningstechnieken': {
      knowledge: {
        easy: ['Waarom is ademhaling de snelste manier om te kalmeren?'],
        medium: ['Hoe gebruik je beeldspraak bij ademhalingsoefeningen voor jonge kinderen?'],
        hard: ['Hoe zorg je dat ademhalingstechnieken normaal worden in de groep?']
      },
      pictionary: { easy: ['Ademhaling'], medium: ['Ontspanning'], hard: ['Beeldspraak'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij ademhaling'], 
        medium: ['Noem woorden die horen bij ontspanningstechnieken'], 
        hard: ['Noem woorden die horen bij beeldspraak gebruiken'] 
      }
    },
    'Gedrag - Tastbare Bekrachtiging en Stop-instructie': {
      knowledge: {
        easy: ['Wanneer mag je tastbare bekrachtiging zoals stickers gebruiken?'],
        medium: ['Hoe geef je een effectieve stop-instructie?'],
        hard: ['Waarom is de stop-instructie effectiever dan \'niet doen\' instructies?']
      },
      pictionary: { easy: ['Tastbare bekrachtiging'], medium: ['Stop-instructie'], hard: ['Begrenzen'] },
      seconds30: { 
        easy: ['Noem woorden die horen bij tastbare bekrachtiging'], 
        medium: ['Noem woorden die horen bij stop-instructies'], 
        hard: ['Noem woorden die horen bij effectief begrenzen'] 
      }
    }
  };

  const taskTypes = ['knowledge', 'pictionary', 'seconds30'];
  const difficultyLevels = { 1: 'easy', 2: 'medium', 3: 'hard' };
// Aparte useEffect voor URL game joining (spelers)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const gameIdFromUrl = urlParams.get('game');

  if (!gameIdFromUrl) return;

  setGameId(gameIdFromUrl);
  setIsGameMaster(false);
  setIsJoinMode(true);

  const storedTeam = localStorage.getItem(`game_${gameIdFromUrl}_team`);
  if (storedTeam) {
    const teamIndex = parseInt(storedTeam, 10);
    setPlayerTeam(teamIndex);
    setIsJoinMode(false);
    setTeams(prev => prev.map((team, index) => 
      index === teamIndex ? { ...team, connected: true } : team
    ));
  }
}, []);

// Aparte useEffect voor Firebase listener (iedereen met een gameId)
useEffect(() => {
  if (!gameId) return;

  const unsub = listenToGameUpdates(gameId, (data) => {
    if (data.teams) setTeams(data.teams);
    if (typeof data.state === 'string') setGameState(data.state);
    if (typeof data.currentTeam === 'number') setCurrentTeam(data.currentTeam);
    if (data.currentTask !== undefined) setCurrentTask(data.currentTask);
  });

  return () => { if (typeof unsub === 'function') unsub(); };
}, [gameId]);

  useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

// Firebase functions for multiplayer
const saveGameToFirebase = async (gameId, gameData) => {
  try {
    await set(ref(database, `games/${gameId}`), gameData);
  } catch (error) {
    console.error('Error saving game:', error);
  }
};

const joinTeamInFirebase = async (gameId, teamIndex) => {
  try {
    await set(ref(database, `games/${gameId}/teams/${teamIndex}/connected`), true);
  } catch (error) {
    console.error('Error joining team:', error);
  }
};

const listenToGameUpdates = (gameId, callback) => {
  const gameRef = ref(database, `games/${gameId}`);
  return onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Normaliseer teams: object → array
    const normalized = {
      ...data,
      teams: Array.isArray(data.teams) ? data.teams : Object.values(data.teams || {})
    };

    callback(normalized);
  });
};  
const generateGameId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

const createQRGame = async () => {
  if (selectedPresets.length === 0) {
    alert('Selecteer minimaal één preset!');
    return;
  }
  const newGameId = generateGameId();
  setGameId(newGameId);
  
  // Save game to Firebase
  const gameData = {
    id: newGameId,
    presets: selectedPresets,
    boardSize: boardSize,
    teams: teams,
    state: 'qr-code',
    currentTeam: 0,
    currentTask: null,
    currentBet: null
  };
  
  await saveGameToFirebase(newGameId, gameData);
  
  // Listen for ALL game updates, not just teams
 listenToGameUpdates(newGameId, (data) => {
  if (data.teams) setTeams(data.teams);               // al genormaliseerd
  if (typeof data.state === 'string') setGameState(data.state);
  if (typeof data.currentTeam === 'number') setCurrentTeam(data.currentTeam);
  if (data.currentTask !== undefined) setCurrentTask(data.currentTask);
});
  
  setGameState('qr-code');
};

const startGame = async () => {
  const connectedTeams = teams.filter(team => team.connected).length;
  if (connectedTeams === 0) {
    alert('Er moet minimaal één team aangesloten zijn!');
    return;
  }
  
  // Update game state in Firebase
  const gameData = {
    id: gameId,
    presets: selectedPresets,
    boardSize: boardSize,
    teams: teams,
    state: 'playing',
    currentTeam: 0,
    currentTask: null,
    currentBet: null
  };
  
  await saveGameToFirebase(gameId, gameData);
  
  setGameState('playing');
  setCurrentTeam(0);
  setCurrentTask(null);
  setCurrentBet(null);
};

const joinTeam = async (teamIndex) => {
  setPlayerTeam(teamIndex);
  setIsJoinMode(false);
  
  localStorage.setItem(`game_${gameId}_team`, teamIndex.toString());
  
  const newUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}&team=${teamIndex}`;
  window.history.replaceState({}, '', newUrl);
  
  // Update team in Firebase
  await joinTeamInFirebase(gameId, teamIndex);
  
  // Update local state
  setTeams(prev => prev.map((team, index) => 
    index === teamIndex ? { ...team, connected: true } : team
  ));
};

  const getTask = () => {
    if (!currentBet) return;
    
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const difficulty = difficultyLevels[currentBet];
    const preset = selectedPresets[Math.floor(Math.random() * selectedPresets.length)];
    
    const taskContent = availablePresets[preset][taskType][difficulty];
    const randomTask = taskContent[Math.floor(Math.random() * taskContent.length)];
    
    setCurrentTask({
      type: taskType,
      difficulty: difficulty,
      content: randomTask,
      preset: preset,
      steps: currentBet
    });
  };

  const startTask = () => {
    if (currentTask?.type === 'seconds30' || currentTask?.type === 'pictionary') {
      setTimer(30);
      setTimerActive(true);
    }
  };

  const judgeAnswer = (correct) => {
    if (correct) {
      const newTeams = [...teams];
      newTeams[currentTeam].position = Math.min(boardSize, newTeams[currentTeam].position + currentTask.steps);
      setTeams(newTeams);
      
      if (newTeams[currentTeam].position >= boardSize) {
        alert(`${newTeams[currentTeam].name} heeft gewonnen!`);
        setGameState('finished');
        return;
      }
    }
    
    let nextTeam = (currentTeam + 1) % 4;
    while (!teams[nextTeam].connected && nextTeam !== currentTeam) {
      nextTeam = (nextTeam + 1) % 4;
    }
    setCurrentTeam(nextTeam);
    
    setCurrentBet(null);
    setCurrentTask(null);
    setTimer(0);
    setTimerActive(false);
  };

  const generateQRCodeUrl = (gameId) => {
    const joinUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
  };

  if (isJoinMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">🎮</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welkom bij het spel!</h1>
            <p className="text-purple-200">Kies jouw teamkleur om mee te doen</p>
          </div>
          
          <div className="space-y-4">
            {teams.map((team, index) => (
              <button
                key={index}
                onClick={() => joinTeam(index)}
                disabled={team.connected}
                className={`w-full p-6 rounded-2xl border-2 font-bold text-lg transition-all transform ${
                  team.connected 
                    ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                    : `${team.color} text-white border-white hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl`
                }`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className={`w-6 h-6 rounded-full ${team.connected ? 'bg-gray-400' : 'bg-white'}`}></div>
                  <span>{team.name}</span>
                  {team.connected && <span className="text-sm">(Bezet)</span>}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-purple-200 text-sm">Game ID: {gameId}</p>
          </div>
        </div>
      </div>
    );
  }

if (!isGameMaster && playerTeam !== null) {
    const myTeam = teams[playerTeam];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${myTeam.color} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{playerTeam + 1}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{myTeam.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-xs text-purple-200">Game ID</div>
              <div className="text-sm text-white font-mono">{gameId}</div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Speelbord</h2>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({length: boardSize}, (_, i) => (
                <div key={i} className={`aspect-square border-2 rounded-xl flex items-center justify-center relative ${
                  i === boardSize - 1 ? 'border-yellow-400 bg-yellow-100' : 
                  i === 0 ? 'border-green-400 bg-green-100' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <span className="text-xs font-medium text-gray-600">{i + 1}</span>
                  {teams.filter(team => team.connected).map((team, teamIndex) => 
                    team.position === i + 1 && (
                      <div key={teamIndex} className={`absolute w-4 h-4 rounded-full ${team.color} border-2 border-white shadow-lg`}></div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {gameState === 'playing' && currentTeam === playerTeam && !currentBet && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-center mb-6">🎯 Kies je strategie!</h3>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(bet => (
                  <button
                    key={bet}
                    onClick={() => setCurrentBet(bet)}
                    className={`p-6 rounded-2xl border-2 text-center font-bold ${
                      bet === 1 ? 'border-emerald-400 bg-emerald-100 text-emerald-800' : ''
                    }${bet === 2 ? 'border-amber-400 bg-amber-100 text-amber-800' : ''}${
                      bet === 3 ? 'border-rose-400 bg-rose-100 text-rose-800' : ''
                    }`}
                  >
                    <div className="text-3xl mb-2">{bet}</div>
                    <div className="text-sm">{bet === 1 ? '🟢 Veilig' : bet === 2 ? '🟡 Risico' : '🔴 Moedig'}</div>
                  </button>
                ))}
              </div>
              {currentBet && (
                <button
                  onClick={getTask}
                  className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg"
                >
                  🎯 Krijg Opdracht
                </button>
              )}
            </div>
          )}

          {gameState === 'playing' && currentTask && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-center mb-6">📝 Jouw Opdracht</h3>
              <div className="text-center">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="font-bold text-lg mb-2">{currentTask.preset}</p>
                  <p className="text-gray-700">{currentTask.content}</p>
                </div>
                <p className="text-sm text-gray-600">
                  Inzet: <span className="font-bold">{currentTask.steps} punten</span>
                </p>
                <p className="text-sm text-green-600 font-medium mt-2">
                  Wacht op gamemaster beoordeling...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

 // Gamemaster view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Training Bordspel</h1>
          {gameId && <div className="text-white">Game ID: {gameId}</div>}
        </div>

        {/* VERWIJDER DE DEBUG INFO als het werkt */}
{/* VERWIJDER DE DEBUG INFO als het werkt */}
{/* VERWIJDER DE DEBUG INFO als het werkt */}
<div className="bg-red-500 text-white p-4 rounded mb-4">
  <p>Debug: gameState = {gameState}</p>
  <p>Debug: isGameMaster = {isGameMaster ? 'true' : 'false'}</p>
  <p>Debug: teams connected = {teams.filter(t => t.connected).length}</p>
  <p>Debug: currentTask = {currentTask ? 'YES' : 'NO'}</p>
  <p>Debug: teams is array = {Array.isArray(teams) ? 'YES' : 'NO'}</p>
  <p>Debug: should show GM interface = {gameState === 'playing' && isGameMaster ? 'YES' : 'NO'}</p>
</div>

{/* EXTRA TEST - VOEG DIT HIER TOE */}
{gameState === 'playing' && (
  <div className="bg-green-500 text-white p-4 rounded mb-4">
    <p>Game is PLAYING!</p>
  </div>
)}

{isGameMaster && (
  <div className="bg-blue-500 text-white p-4 rounded mb-4">
    <p>Je bent GAMEMASTER!</p>
  </div>
)}

{/* TIJDELIJKE TEST - ALTIJD TONEN */}
<div className="bg-yellow-500 text-black p-4 rounded mb-4">
  <p>TEST: Deze div zou ALTIJD moeten verschijnen!</p>
</div>

{gameState === 'playing' && isGameMaster && (
  // ... rest van de gamemaster interface
        
        {gameState === 'playing' && isGameMaster && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-center mb-6">🎮 Gamemaster Controle</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-3">🏆 Scores</h3>
                <div className="space-y-2">
                  {teams.map((team, index) => (
  team.connected && (
    <div key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded">
      <span className={currentTeam === index ? 'font-bold text-blue-600' : ''}>
        {team.name} {currentTeam === index && '👈'}
      </span>
                      <span className="font-bold">{team.position || 0}</span>
                    </div>
                    )
))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-3">🎯 Huidige Opdracht</h3>
                {currentTask ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-bold">{teams[currentTeam]?.name}</p>
                    <p className="text-sm text-gray-600 mb-2">Inzet: {currentTask.steps} punten</p>
                    <p className="mb-4">{currentTask.content}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => judgeAnswer(true)}
                        className="flex-1 bg-green-600 text-white py-2 rounded font-bold"
                      >
                        ✅ Geslaagd
                      </button>
                      <button
                        onClick={() => judgeAnswer(false)}
                        className="flex-1 bg-red-600 text-white py-2 rounded font-bold"
                      >
                        ❌ Gefaald
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Wacht op team actie...</p>
                )}
              </div>
            </div>
          </div>
        )}

{gameState === 'setup' && (
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Spel Configuratie</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">📚 Selecteer Presets:</h3>
                <div className="space-y-2">
                  {Object.keys(availablePresets).map(preset => (
                    <label key={preset} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedPresets.includes(preset)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPresets([...selectedPresets, preset]);
                          } else {
                            setSelectedPresets(selectedPresets.filter(p => p !== preset));
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">🎯 Speelbord Grootte:</h3>
                <div className="space-y-3">
                  {[10, 15, 20].map(size => (
                    <label key={size} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="boardSize"
                        checked={boardSize === size}
                        onChange={() => setBoardSize(size)}
                        className="w-5 h-5"
                      />
                      <span>{size} hokjes ({size === 10 ? 'Snel' : size === 15 ? 'Standaard' : 'Lang'})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={createQRGame}
                className="bg-green-500 text-white px-12 py-4 rounded-2xl font-bold text-xl hover:bg-green-600"
              >
                📱 Genereer QR-Code
              </button>
            </div>
          </div>
        )}

       {gameState === 'qr-code' && (
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Teams kunnen nu aansluiten!</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center">
                <div className="bg-white p-6 rounded-2xl shadow-lg inline-block">
                  <img 
                    src={generateQRCodeUrl(gameId)} 
                    alt="QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <p className="mt-4">Game ID: <strong>{gameId}</strong></p>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6">Teams Status</h3>
                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div key={index} className={`p-4 rounded-2xl border-2 ${
                      team.connected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full ${team.color}`}></div>
                          <span className="font-semibold">{team.name}</span>
                        </div>
                        {team.connected ? (
                          <span className="text-green-600 font-medium">Aangesloten</span>
                        ) : (
                          <span className="text-gray-400">Wachten...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startGame}
                  disabled={teams.filter(t => t.connected).length === 0}
                  className={`w-full mt-8 py-4 rounded-2xl font-bold text-xl ${
                    teams.filter(t => t.connected).length === 0
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  🚀 Start Spel ({teams.filter(t => t.connected).length} teams)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingBoardGame;