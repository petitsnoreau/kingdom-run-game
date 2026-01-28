#!/bin/bash

if [ "$1" == "start" ] && [ -f "babel.config.json" ];
then
    mv "babel.config.json" babel_test
fi

if [ "$1" == "test" ] && [ -f "babel_test" ];
then
    mv babel_test "babel.config.json"
fi
