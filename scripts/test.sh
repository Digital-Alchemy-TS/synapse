#!/bin/bash
NODE_OPTIONS="$NODE_OPTIONS --experimental-vm-modules" npx vi --pass-with-no-tests --runInBand "$1" || exit 1
