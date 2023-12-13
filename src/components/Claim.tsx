import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { GraphiQL } from "graphiql";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { definition } from "../__generated__/definition.js";
import KeyResolver from "key-did-resolver";
import { DagJWS } from "dids";
import "graphiql/graphiql.min.css";
import { useComposeDB } from "../fragments/index";
import { DID } from "dids";
import { CeramicClient } from "@ceramicnetwork/http-client";
import CID from "cids";

enum ClaimTypes {
  verifiableCredential = "verifiableCredential",
  baseCredentail = "baseCredential",
}

type Queries = {
  values: [{ query: string }, { query: string }];
};

export default function Create() {
  const { compose, keySession } = useComposeDB();
  const { address, isDisconnected } = useAccount();
  const [attesting, setAttesting] = useState(false);
  const [claim, setClaim] = useState<ClaimTypes>(ClaimTypes.baseCredentail);
  const [loggedIn, setLoggedIn] = useState(false);
  const [destination, setDestination] = useState<string>("");
  const [signature, setSignature] = useState<"EIP712" | "JWT">("EIP712");

  const [queries, setQueries] = useState<Queries>({
    values: [
      {
        query: `query BaseCredentials{
        trustIndex(last: 1){
          edges{
            node{
              recipient{
                id
              }
              controller {
                id
              }
              trusted
              jwt
            }
          }
        }
      }`,
      },
      {
        query: "",
      },
    ],
  });

  const fetcher = async (graphQLParams: Record<string, any>) => {
    const composeClient = new ComposeClient({
      ceramic: "http://localhost:7007",
      definition: definition as RuntimeCompositeDefinition,
    });

    const data = await composeClient.executeQuery(`${graphQLParams.query}`);
    console.log(data);

    if (data && data.data && !data.data.__schema) {
      return data.data;
    }
  };

  const saveBaseCredential = async () => {
    const credential = {
      recipient: `did:pkh:eip155:1:${destination.toLowerCase()}`,
      trusted: true,
    };

    if (keySession) {
      const jws = await keySession.did.createJWS(credential);
      const jwsJsonStr = JSON.stringify(jws);
      const jwsJsonB64 = Buffer.from(jwsJsonStr).toString("base64");
      const completeCredential = {
        ...credential,
        jwt: jwsJsonB64,
      };
      const data = await compose.executeQuery(`
      mutation{
        createTrust(input: {
          content: {
            recipient: "${completeCredential.recipient}"
            trusted: ${completeCredential.trusted}
            jwt: "${completeCredential.jwt}"
          }
        })
        {
          document{
            id
            recipient{
              id
            }
            trusted
            jwt
          }
        }
      }
    `);
      console.log(data);
      await validateBaseCredential();
    }
  };

  const validateBaseCredential = async () => {
    const credential: any = await compose.executeQuery(
      `query {
        trustIndex(last: 1){
          edges{
            node{
              recipient{
                id
              }
              controller {
                id
              }
              trusted
              jwt
              id
            }
          }
        }
      }`
    );
    console.log(credential.data)
    if (credential.data.trustIndex.edges.length > 0) {
      //obtain did:key used to sign the credential
      const credentialToValidate = credential.data.trustIndex.edges[0].node.jwt;
      const json = Buffer.from(credentialToValidate, "base64").toString();
      const parsed = JSON.parse(json);
      console.log(parsed);
      //@ts-ignore
      const newDid = new DID({ resolver: KeyResolver.getResolver() });
      const result = await newDid.verifyJWS(parsed);
      const didFromJwt = result.didResolutionResult?.didDocument?.id;
      console.log('This is the payload: ', result.payload);
      //obtain did:key used to authorize the did-session
      const stream = credential.data.trustIndex.edges[0].node.id;
      const ceramic = new CeramicClient("http://localhost:7007");
      const streamData = await ceramic.loadStreamCommits(stream);
      const cid: CID | undefined = streamData[0] as CID;
      //@ts-ignore
      const cidString = cid?.cid;
      const url = `http://localhost:5001/api/v0/dag/get?arg=${cidString}&output-codec=dag-json`;
      const data = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const toJson: DagJWS = await data.json();
      const res = await newDid.verifyJWS(toJson);
      const didFromDag = res.didResolutionResult?.didDocument?.id;
      console.log(didFromJwt, didFromDag);
      if (didFromJwt === didFromDag) {
        console.log("Valid");
      } else {
        console.log("Invalid");
      }
    }
  };

  const createClaim = async () => {
    if (claim === ("baseCredential" as ClaimTypes)) {
      await saveBaseCredential();
    }
  };

  useEffect(() => {
    if (address) {
      setLoggedIn(true);
      validateBaseCredential();
    }
  }, [address]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="m-auto w-1/2 h-1/2">
        {address && (
          <div className="right">
            <img alt="Network logo" className="logo" src={"/ethlogo.png"} />

            <p style={{ textAlign: "center" }}>
              {" "}
              Connected with: {address.slice(0, 6)}...{address.slice(-4)}{" "}
            </p>
          </div>
        )}

        <div className="GradientBar" />
        <div className="WhiteBox">
          <>
            <div className="subTitle"> I trust: </div>
            <div className="InputContainer">
              <input
                className="InputBlock"
                autoCorrect={"off"}
                autoComplete={"off"}
                autoCapitalize={"off"}
                placeholder={"Address"}
                value={destination}
                onChange={(e) => setDestination(e.target.value.toLowerCase())}
              />
            </div>
            <div>Claim format: </div>
            <form className="px-4 py-3 m-3">
              <select
                className="text-center"
                onChange={(values) =>
                  setClaim(values.target.value as unknown as ClaimTypes)
                }
                value={claim}
              >
                <option value="baseCredential">Base Credential</option>
              </select>
            </form>
            {/* {claim === "verifiableCredential" && (
              <>
                <div>Select a signature format</div>
                <form className="px-4 py-3 m-3">
                  <select
                    className="text-center"
                    onChange={(values) =>
                      setSignature(
                        values.target.value as unknown as "EIP712" | "JWT"
                      )
                    }
                    value={signature}
                  >
                    <option value="EIP712">EIP712</option>
                    <option value="JWT">JWT</option>
                  </select>
                </form>
              </>
            )} */}
          </>
          <button className="MetButton" onClick={createClaim}>
            {attesting ? "Creating Claim..." : "Generate Claim"}
          </button>
        </div>
      </div>
      {loggedIn && (
        <div style={{ height: "60rem", width: "90%", margin: "auto" }}>
          {/* @ts-ignore */}
          <GraphiQL
            fetcher={fetcher}
            // @ts-ignore
            storage={null}
            defaultTabs={queries.values}
          />
        </div>
      )}
    </div>
  );
}
