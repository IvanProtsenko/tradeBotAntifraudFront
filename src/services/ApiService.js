import makeApolloClient from './utils/makeApolloClient';
import gql from 'graphql-tag';

const GET_ACCOUNTS = gql`
  query GetAccounts {
    accounts {
      id
      email
      activity_status
      freezed_balance
      available_balance
      gauth
      should_run
      platform
      password
      searchable
      fightable
      proxy {
        host
        port
      }
    }
  }
`;

const UPDATE_ACCOUNT = gql`
  mutation MyMutation7($id: Int!, $_set: accounts_set_input!) {
    update_accounts_by_pk(pk_columns: {id: $id}, _set: $_set) {
      id
    }
  }
`

const CONNECT_ACCOUNT_TO_PROXY = gql`
  mutation CreateAccount(
    $email: String
    $password: String
    $gauth: String
    $proxyId: Int
  ) {
    insert_accounts(
      objects: {
        email: $email
        password: $password
        gauth: $gauth
        proxy_id: $proxyId
      }
    ) {
      returning {
        email
        gauth
        password
      }
    }
  }
`;

const GET_PROXIES_BY_HOST_PORT = gql`
  query GetProxiesByHostPort($host: String, $port: String) {
    proxies(where: { _and: { host: { _eq: $host }, port: { _eq: $port } } }) {
      id
    }
  }
`;

const GET_PROXY_BY_PK = gql`
  query ProxyByPk($id: Int!) {
    proxies_by_pk(id: $id) {
      id
    }
  }
`;

const CREATE_ACCOUNT_WITH_PROXY = gql`
  mutation CreateAccount(
    $email: String
    $password: String
    $gauth: String
    $proxyIp: String
    $proxyPort: String
    $proxyLogin: String
    $proxyPass: String
  ) {
    insert_accounts(
      objects: {
        email: $email
        password: $password
        gauth: $gauth
        proxy: {
          data: {
            host: $proxyIp
            port: $proxyPort
            username: $proxyLogin
            password: $proxyPass
          }
        }
      }
    ) {
      returning {
        email
        gauth
        password
        proxy {
          id
          host
          port
          username
          password
        }
      }
    }
  }
`;

const SUBSCRIBE_ACCOUNTS = gql`
  subscription SubscribeAccounts {
    accounts {
      id
      email
      activity_status
      available_balance
      freezed_balance
      gauth
      should_run
      platform
      password
      searchable
      fightable
      proxy {
        host
        port
      }
    }
  }
`;

const DELETE_ACCOUNT = gql`
  mutation DeleteAccountByPk($id: Int!) {
    delete_accounts_by_pk(id: $id) {
      id
    }
  }
`;

const DELETE_ACCOUNTS = gql`
  mutation DeleteAccounts($ids: [Int!]!) {
    delete_accounts(where: { id: { _in: $ids } }) {
      affected_rows
    }
  }
`;

class ApiService {
  client;

  constructor(client) {
    this.client = client;
  }

  getAccounts = async () => {
    try {
      const result = await this.client.query({
        query: GET_ACCOUNTS,
      });
      return result.data.accounts;
    } catch (err) {
      console.log('ERROR getAccounts:', err);
    }
  };

  getProxiesByHostPort = async (host, port) => {
    try {
      const result = await this.client.query({
        query: GET_PROXIES_BY_HOST_PORT,
        variables: {
          host,
          port,
        },
      });
      return result.data.proxies;
    } catch (err) {
      console.log('ERROR getProxiesByHostPort:', err);
    }
  };

  getProxyByPk = async (id) => {
    try {
      const result = await this.client.query({
        query: GET_PROXY_BY_PK,
        variables: {
          id,
        },
      });
      return result.data.proxies_by_pk;
    } catch (err) {
      console.log('ERROR getProxyByPk:', err);
    }
  };

  createAccount = async (data) => {
    try {
      if (data.proxyId) {
        let proxy = await this.getProxyByPk(data.proxyId);
        if (proxy) {
          const result = await this.client.mutate({
            mutation: CONNECT_ACCOUNT_TO_PROXY,
            variables: {
              email: data.email,
              password: data.password,
              gauth: data.gauth,
              proxyId: data.proxyId,
            },
          });
          console.log(result);
          return result.data.insert_accounts;
        } else {
          throw new Error('no such proxy id');
        }
      } else {
        const result = await this.client.mutate({
          mutation: CREATE_ACCOUNT_WITH_PROXY,
          variables: {
            email: data.email,
            password: data.password,
            gauth: data.gauth,
            proxyIp: data.proxyIp,
            proxyPort: data.proxyPort,
            proxyLogin: data.proxyLogin,
            proxyPass: data.proxyPass,
          },
        });
        console.log(result);
        return result.data.insert_accounts;
      }
    } catch (err) {
      console.log('ERROR createAccount:', err);
    }
  };

  updateAccount = async (account) => {
    try {
      delete account.__typename
      delete account.proxy
      const result = await this.client.mutate({
        mutation: UPDATE_ACCOUNT,
        variables: {
          id: account.id,
          _set: account
        },
      });
      console.log(result);
    } catch (err) {
      console.log('ERROR updateAccount:', err);
    }
  }

  deleteAccount = async (id) => {
    try {
      const result = await this.client.mutate({
        mutation: DELETE_ACCOUNT,
        variables: {
          id,
        },
      });
      console.log(result);
    } catch (err) {
      console.log('ERROR deleteAccount:', err);
    }
  };

  deleteAccounts = async (ids) => {
    try {
      const result = await this.client.mutate({
        mutation: DELETE_ACCOUNTS,
        variables: {
          ids,
        },
      });
      console.log(result);
    } catch (err) {
      console.log('ERROR deleteAccounts:', err);
    }
  };
}

const client = makeApolloClient(
  process.env.REACT_APP_API_URL,
  process.env.REACT_APP_API_WS_URL,
  'MAIN'
);
const apiService = new ApiService(client);
export { client, apiService, SUBSCRIBE_ACCOUNTS };
