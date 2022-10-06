#!/bin/bash
# Generates Typescript Protobuf classes based on the `ts_proto` plugin.

mkdir temp_protobuf_gen
cd temp_protobuf_gen
ln -s ../../../protobuf/PlayerSubmissionData.proto .
protoc --plugin=../../node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=../../src/protobuf_gen/ PlayerSubmissionData.proto
cd ..
rm -rf temp_protobuf_gen
