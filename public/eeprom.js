
examples["EEPROM"] = {
    "main.py": `# Copyright (C) 2019 Hannu Viitala
#
# The source code in this file is released under the MIT license.
# Go to http://opensource.org/licenses/MIT for the full license details.
#

# *** AN EXAMPLE OF SAVING AND LOADING DATA FROM EEPROM ***

import upygame
import umachine
import urandom

# Gets a fixed size string from a byte array 
def getStringFromByteArray(dataBuf, pos, length):
    data = bytearray(length)
    for i in range(length): data[i]=dataBuf[i+pos]
    return str(data, "utf-8"), pos+length

# Gets an integer from a byte array 
def getIntFromByteArray(dataBuf, pos, length):
    data = bytearray(length)
    for i in range(length): data[i]=dataBuf[i+pos]
    return int.from_bytes(data, 'big'), pos+length

# Saves the scores to EEPROM.
def saveScoresToEeprom(name8Chars1, score1, name8Chars2, score2):
    
    # Construct the byte array and copy it to the myCookieData.
    # Note: The names should be EXACTLY 8 chars long in this example!
    # Note: Negative numbers do not work (!) because the 'signed' parameter do not work in to_bytes()
    data =  bytearray(name8Chars1)
    data +=  score1.to_bytes(3,'big')
    data +=  bytearray(name8Chars2)
    data +=  score2.to_bytes(3,'big')
    for i in range(len(data)): myCookieData[i]=data[i]
    
    # Save myCookieData to EEPROM.
    myCookie.save()

# Loads the scores from EEPROM.
def loadScoresFromEeprom():
    
    # Load myCookieData from EEPROM.
    myCookie.load()
    
    # Parse the scores and the names from myCookieData.
    pos = 0
    name8Chars1, pos = getStringFromByteArray(myCookieData, pos, 8)
    score1, pos = getIntFromByteArray(myCookieData, pos, 3)
    name8Chars2, pos = getStringFromByteArray(myCookieData, pos, 8)
    score2, pos = getIntFromByteArray(myCookieData, pos, 3)
    return name8Chars1, score1, name8Chars2, score2

# Setup the screen buffer
upygame.display.init(True)
screen = upygame.display.set_mode()

# Initialize the cookie.
myCookieDataSize = 8+3+8+3 # Two names and two scores
myCookieData = bytearray(myCookieDataSize)
myCookie = umachine.Cookie("Tetrix", myCookieData)

# The main loop
nameA = "None"
scoreA = 0
nameB = "None"
scoreB = 0
while True:
    # Read keys
    eventtype = upygame.event.poll()
    if eventtype != upygame.NOEVENT and eventtype.type == upygame.KEYDOWN:
        if eventtype.key == upygame.BUT_C:
            # Randomize names and scores
            names = ["Lewis   ", "Max     ", "Kimi    ", "Valtteri"]
            scores = [12345, 23456, 34567, 45678]
            nameA = names[urandom.getrandbits(2)]
            scoreA = scores[urandom.getrandbits(2)]
            nameB = names[urandom.getrandbits(2)]
            scoreB = scores[urandom.getrandbits(2)]
        if eventtype.key == upygame.BUT_B:
            # Save the scores to EEPROM.
            saveScoresToEeprom(nameA, scoreA, nameB, scoreB)
            print("saved")
        if eventtype.key == upygame.BUT_A:
            # Load the scores from EEPROM.
            nameA, scoreA, nameB, scoreB = loadScoresFromEeprom()
            print("loaded")

    # Draw texts.
    umachine.draw_text(0,10,"SCORES", 10)
    umachine.draw_text(0,20,"======", 10)
    umachine.draw_text(5,30,nameA+"  "+str(scoreA), 10)
    umachine.draw_text(5,40,nameB+"  "+str(scoreB), 10)
    
    # Draw instructions.
    umachine.draw_text(5,60,"A:Load from EEPROM", 11)
    umachine.draw_text(5,70,"B:Save to EEPROM", 11)
    umachine.draw_text(5,80,"C:Randomize", 11)


    # Update display
    upygame.display.flip()
`
};
