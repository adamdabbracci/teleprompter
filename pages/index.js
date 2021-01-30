import React from "react"
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const speechText = `A great speech must be masterfully constructed. The best orators are masters of both the written and spoken word, and use words to create texts that are beautiful to both hear and read.

A speech may be flowery and charismatically presented, and yet lack any true substance at all. Great oratory must center on a worthy theme; it must appeal to and inspire the audience’s finest values and ideals.`

function stringToWords(str) {
  const splitUp = str.toLowerCase().split(" ")
  const result = []
  splitUp.forEach((wordWithPunctuation) => {
    result.push({
      full: wordWithPunctuation,
      word: wordWithPunctuation.replace(/[,\.\-]/g, ''),
      characterCount: wordWithPunctuation.length + 1
    })
  })
  return result
}

var processTranscript

export default function Home() {

  let [recognition, setRecognition] = React.useState(null)
  let [status, setStatus] = React.useState("off")
  let [cursorPosition, setCursorPosition] = React.useState({
    word: 0,
    letter: 0,
    tempLetter: 0,
    tempWord: 0,
    isFinal: true
  })
  const speechWords = stringToWords(speechText)
  
  React.useEffect(() => {
    var SpeechRecognition = SpeechRecognition || window.webkitSpeechRecognition;
    var r = new SpeechRecognition();
    
    /*-----------------------------
          Voice Recognition 
    ------------------------------*/

    // If false, the recording will stop after a few seconds of silence.
    // When true, the silence period is longer (about 15 seconds),
    // allowing us to keep recording even when the user pauses. 
    r.continuous = true;
    r.lang = 'en-US';
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = function () {
      console.log('Voice recognition activated. Try speaking into the microphone.');
      setStatus("on")
    }
    
    r.onend = function () {
      setStatus("off")
    }

    r.onspeechend = function () {
      console.log('You were quiet for a while so voice recognition turned itself off.');
      setStatus("off")
    }

    r.onerror = function (event) {
      if (event.error == 'no-speech') {
        console.log('No speech was detected. Try again.');
        setStatus("error")
      };
    }

    setRecognition(r)
  }, [])

  // React.useEffect(() => {
    
  // }, [cursorPosition])


  function processTranscript(transcript, isFinal) {
    const compared = compareInputToSpeech(transcript)
      if (compared.foundIndex === -1) {
        return
      }

      let newCursorPosition
      if (isFinal) {
        newCursorPosition = {
          word: cursorPosition.word + compared.foundIndex + 1,
          letter: cursorPosition.letter + compared.charactersToAdvance,
          tempWord: cursorPosition.word + compared.foundIndex + 1,
          tempLetter: cursorPosition.letter + compared.charactersToAdvance,
          isFinal,
        }
      }
      else {
        newCursorPosition = {
          ...cursorPosition,
          tempWord: cursorPosition.word + compared.foundIndex + 1,
          tempLetter: cursorPosition.letter + compared.charactersToAdvance,
          isFinal,
        }
      }
      console.log(`New cursor`, newCursorPosition)
      setCursorPosition(newCursorPosition)
  }
  

  function compareInputToSpeech(transcript) {
      let transcriptWords = stringToWords(transcript)
      let remainingWords = speechWords.slice(cursorPosition.word)
      let testWords = [transcriptWords[transcriptWords.length - 1], transcriptWords[transcriptWords.length - 2]]
      let foundIndex = remainingWords.findIndex(x => {
        return x.word === testWords[0].word
      })
      let charactersToAdvance = remainingWords.slice(0, foundIndex + 1).reduce((accumulator, word) => {
        return accumulator + word.characterCount
      }, 0)

      let results = {
        charactersToAdvance,
        speechWords: speechWords,
        testWord: testWords[0],
        testWords: testWords,
        remainingWords,
        transcriptWords,
        foundIndex,
        cursorPosition: cursorPosition,
      }
      
      console.log(results)

      return results
  }
  
  function generateHighlightedHtml(speechText) {
    // const completedWords = speechWords.slice(0, cursorPosition.word)
    // const incompleteWords = speechWords.slice(cursorPosition.word)

    // console.log({
    //   completedWords,
    //   incompleteWords,
    // })

    return(
      <div style={{
        width: "90%",
        wordBreak: "break-words",
        fontSize: "3rem"
      }}>
        <span style={{
          background: "yellow"
        }}>
          {speechText.substr(0, cursorPosition.letter)}
          </span>

         {
           cursorPosition.tempLetter > cursorPosition.letter && (
            <span style={{
              background: "orange"
            }}>
              {speechText.substr(cursorPosition.letter, (cursorPosition.tempLetter - cursorPosition.letter))}
              </span>
           )
         }

          <span>{speechText.substr(cursorPosition.tempLetter, speechText.length)}</span>
      </div>
    )
    
  }

  function startRecording() {
    if (status === "off") {
       // This block is called every time the Speech APi captures a line. 
      recognition.onresult = function (event) {
        console.debug("EVENT", event)

        // event is a SpeechRecognitionEvent object.
        // It holds all the lines we have captured so far. 
        // We only need the current one.
        var current = event.resultIndex;

        // Get a transcript of what was said.
        // let mostConfidentResult = event.results[current][0]

        // If this is not final, use the most confident result
        // if (!mostConfidentResult.isFinal) {

        // }
        // if (event.results[current][1] && (event.results[current][1] > mostConfidentResult)) {
        //   console.log("Override with 1", event.results[current][1])
        //   mostConfidentResult = event.results[current][1]
        // }
        // if (event.results[current][2] && (event.results[current][2] > mostConfidentResult)) {
        //   console.log("Override with 2", event.results[current][2])
        //   mostConfidentResult = event.results[current][2]
        // }

        var transcript = event.results[current][0].transcript;
        const isFinal = event.results[current].isFinal
        // Add the current transcript to the contents of our Note.
        // There is a weird bug on mobile, where everything is repeated twice.
        // There is no official solution so far so we have to handle an edge case.
        var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

        processTranscript(transcript, isFinal)

      };
      recognition.start()
    }
    else {
      recognition.stop()
    }
   
    // setInterval(() => {
    //   try {
    //     recognition.start()
    //   } catch(ex) {
    //     console.debug(ex)
    //   }
    // }, 3000)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Telepromptr</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Status <a href="https://nextjs.org">{status.toUpperCase()}</a>
          <br></br>
          <button style={{
            fontSize: "1em"
          }} onClick={() => {
            startRecording()
          }}>Start/Stop</button>
        </h1>
        <hr></hr>
        {generateHighlightedHtml(speechText)}
        
        {/*         
        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h3>Documentation &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h3>Learn &rarr;</h3>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/master/examples"
            className={styles.card}
          >
            <h3>Examples &rarr;</h3>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h3>Deploy &rarr;</h3>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
        */}
      </main>

      <footer className={styles.footer}>
          {JSON.stringify(cursorPosition)}
      </footer>
    </div>
  )
}
