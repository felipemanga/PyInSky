#!/bin/sh

STARTDIR=$PWD

BUILDID=$1
DIRTYLIB=$2

SRCDIR=$STARTDIR/builds/$BUILDID
OUTDIR=$STARTDIR/public/builds/$BUILDID

cp template/* $SRCDIR/ -r

cd $SRCDIR

CMD="python3 tools/mpy-tool.py -mlongint-impl=none -f -q genhdr/qstrdefs.preprocessed.h "
CMD=$CMD`find *.mpy`
CMD=$CMD" > frozen_mpy.c"

eval $CMD

node ../../jake.js $DIRTYLIB

cd $STARTDIR

cp $SRCDIR/build.bin $OUTDIR/build.bin
