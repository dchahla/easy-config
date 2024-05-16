# S3 

This is a command-line tool to list Amazon S3 buckets in different AWS regions, allow the user to select a bucket, and generate a configuration file (.env or JSON) with the bucket details.

## Features

- Lists S3 buckets in each AWS region
- Prompts user to select a region and a bucket
- Generates a configuration file with the selected bucket's details

## Prerequisites

- Node.js (version 14 or higher)
- AWS CLI configured with valid credentials

## Installation

1. Clone the repository or download the source code.
2. Navigate to the project directory.

```sh
cd easy-config/aws/s3
nvm use 20.11 && node index.mjs

