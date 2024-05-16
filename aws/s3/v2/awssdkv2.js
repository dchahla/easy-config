const AWS = require('aws-sdk')
const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')

// List of AWS regions
const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-east-1',
  'ap-south-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-south-1',
  'eu-west-3',
  'eu-north-1',
  'me-south-1',
  'sa-east-1'
]

// Function to list buckets in a specific region
async function listBucketsInRegion (region) {
  AWS.config.update({ region })
  const s3 = new AWS.S3()
  try {
    const response = await s3.listBuckets().promise()
    return response.Buckets.map(bucket => bucket.Name)
  } catch (error) {
    return []
  }
}

// Function to list all regions with bucket counts
async function listRegionsWithBucketCounts () {
  const regionBucketCounts = []
  for (const region of regions) {
    const buckets = await listBucketsInRegion(region)
    regionBucketCounts.push({ region, count: buckets.length, buckets })
  }
  return regionBucketCounts
}

// Function to get bucket details
async function getBucketInfo (bucketName, region) {
  AWS.config.update({ region })
  const s3 = new AWS.S3()
  const location = await s3.getBucketLocation({ Bucket: bucketName }).promise()
  const acl = await s3.getBucketAcl({ Bucket: bucketName }).promise()
  return { location, acl }
}

// Function to prompt user for region and bucket selection and file format
async function promptUser (regionBucketCounts) {
  const regionChoices = regionBucketCounts.map(r => ({
    name: `${r.region} (${r.count} Buckets)`,
    value: r.region,
    buckets: r.buckets
  }))

  const regionAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'region',
      message: 'Select an AWS region:',
      choices: regionChoices
    }
  ])

  const selectedRegion = regionChoices.find(
    r => r.value === regionAnswer.region
  )
  const bucketAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'bucket',
      message: `Select a bucket in ${regionAnswer.region}:`,
      choices: selectedRegion.buckets
    },
    {
      type: 'list',
      name: 'format',
      message: 'Select output format:',
      choices: ['.env', 'json']
    }
  ])

  return { ...regionAnswer, ...bucketAnswer }
}

// Function to generate configuration file
function generateConfigFile (bucketInfo, format, bucketName, region) {
  const fileName = format === '.env' ? '.env' : 'config.json'
  const filePath = path.join(__dirname, fileName)

  if (format === '.env') {
    const content = `BUCKET_NAME=${bucketName}\nREGION=${region}\nACL=${JSON.stringify(
      bucketInfo.acl.Grants
    )}`
    fs.writeFileSync(filePath, content)
  } else {
    const content = {
      bucketName: bucketName,
      region: region,
      acl: bucketInfo.acl.Grants
    }
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2))
  }

  console.log(`Configuration file generated at ${filePath}`)
}

// Main function
async function main () {
  try {
    const regionBucketCounts = await listRegionsWithBucketCounts()
    const { region, bucket, format } = await promptUser(regionBucketCounts)
    const bucketInfo = await getBucketInfo(bucket, region)
    generateConfigFile(bucketInfo, format, bucket, region)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

main()
