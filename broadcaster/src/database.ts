import AWS, { DynamoDB } from 'aws-sdk';
import { CaptainCollection } from './types/captain.collection';
export class Database {
  private dynamodb: DynamoDB;
  private docClient: DynamoDB.DocumentClient;
  private readonly Historical_Table_Name = 'BrLeagues-Warzone-Historical';
  private readonly Captains_Table_Name = 'BrLeagues-Warzone-Captains';
  constructor() {
    let localDev = {
      region: 'local',
      endpoint: 'http://localhost:8000',
    };
    AWS.config.update({
      region: 'eu-west-2',
    });
    this.dynamodb = new DynamoDB();
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  async getHistoricTournament(week: number) {
    const queryParams: DynamoDB.Types.DocumentClient.QueryInput = {
      TableName: this.Historical_Table_Name,
      KeyConditionExpression: '#week = :week',
      ExpressionAttributeNames: {
        '#week': 'week',
      },
      ExpressionAttributeValues: {
        ':week': week,
      },
    };
    const res = await this.docClient.query(queryParams).promise();
    return res.Items[0];
  }

  async InsertNewNewRegisteredCaptain(captain: CaptainCollection) {
    // Insert captain into table BrLeagues-Warzone-Captains
    let params: DynamoDB.Types.DocumentClient.PutItemInput = {
      TableName: this.Captains_Table_Name,
      Item: captain,
    };
    await this.docClient.put(params).promise();
  }

  // async createTableIfNotExists() {
  //   // this.dynamodb.

  //   var params: DynamoDB.Types.CreateTableInput = {
  //     TableName: 'BrLeagues-Warzone',
  //     KeySchema: [
  //       { AttributeName: 'week', KeyType: 'HASH' }, //Partition key
  //     ],
  //     AttributeDefinitions: [{ AttributeName: 'week', AttributeType: 'N' }],
  //     ProvisionedThroughput: {
  //       ReadCapacityUnits: 5,
  //       WriteCapacityUnits: 5,
  //     },
  //   };

  //   await this.dynamodb.deleteTable(
  //     {
  //       TableName: this.tableName,
  //     },
  //     (err, data) => {
  //       console.log(err);
  //     }
  //   );

  //   let result = await this.dynamodb
  //     .createTable(params)
  //     .promise()
  //     .catch((err) => {
  //       if (err.message !== 'Cannot create preexisting table') {
  //         console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));
  //         throw err;
  //       }
  //     });

  //   const docClient = new AWS.DynamoDB.DocumentClient();

  //   let params2 = {
  //     TableName: 'BrLeagues-Warzone',
  //     Item: week4,
  //   };

  //   let result2 = await docClient
  //     .put(params2)
  //     .promise()
  //     .catch((err) => {
  //       throw err;
  //     });

  //   console.log(result2);
  // }
}

new Database();
