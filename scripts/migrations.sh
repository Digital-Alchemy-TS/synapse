#!/bin/sh

yarn db:generate:sqlite
yarn db:generate:postgresql
yarn db:generate:mysql
