import AWS, { DynamoDB } from 'aws-sdk';
import { CaptainCollection } from './types/captain.collection';
export class Database {
  private dynamodb: DynamoDB;
  private docClient: DynamoDB.DocumentClient;
  private readonly Historical_Table_Name = 'BrLeagues-Warzone-Historical';
  private readonly Captains_Table_Name = 'BrLeagues-Warzone-Captains';
  constructor() {
    AWS.config.update({
      region: 'eu-west-1',
    });

    if (process.env.devMode) {
      let localDev = {
        region: 'local',
        endpoint: 'http://localhost:8000',
      };
      AWS.config.update(localDev);
    }
    this.dynamodb = new DynamoDB();
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async InsertNewRegisteredCaptain(captain: CaptainCollection) {
    // Insert captain into table BrLeagues-Warzone-Captains
    let params: DynamoDB.Types.DocumentClient.PutItemInput = {
      TableName: this.Captains_Table_Name,
      Item: captain,
    };
    await this.docClient.put(params).promise();
  }

  async getRegisteredCaptains(startTime: string) {
    let params: DynamoDB.Types.DocumentClient.QueryInput = {
      TableName: this.Captains_Table_Name,
      KeyConditionExpression: '#startTime = :startTime',
      ExpressionAttributeNames: {
        '#startTime': 'startTime',
      },
      ExpressionAttributeValues: {
        ':startTime': startTime,
      },
    };
    return (await this.docClient.query(params).promise()).Items;
  }

  async createTableIfNotExists() {
    // this.dynamodb.

    var params: DynamoDB.Types.CreateTableInput = {
      TableName: this.Captains_Table_Name,
      KeySchema: [
        { AttributeName: 'startTime', KeyType: 'HASH' }, //Partition key
        { AttributeName: 'captainId', KeyType: 'RANGE' }, //Sort key
      ],
      AttributeDefinitions: [
        { AttributeName: 'startTime', AttributeType: 'S' },
        { AttributeName: 'captainId', AttributeType: 'S' },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    };

    await this.dynamodb.deleteTable(
      {
        TableName: this.Captains_Table_Name,
      },
      (err, data) => {
        console.log(err);
      }
    );

    let result = await this.dynamodb
      .createTable(params)
      .promise()
      .catch((err) => {
        if (err.message !== 'Cannot create preexisting table') {
          console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
          throw err;
        }
      });

    console.log(result);
  }
}
