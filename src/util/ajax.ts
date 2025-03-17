/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchJson(url: string) {
    const res = await fetch(url);
    if (res.ok) {
      const result = await res.json();
      return result;
    }
    throw new Error(`${res.statusText}`);
  }
  export async function fetchConfig(configFileName: string) {
    return fetchJson(`/config/${configFileName}`);
  }
  export async function post(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.json();
  }
  