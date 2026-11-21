import { SMTPServer } from "smtp-server";
import { simpleParser, type ParsedMail } from "mailparser";
import type { AddressInfo } from "node:net";

/** Servidor SMTP local para pruebas: guarda los emails recibidos. */
export async function startSmtp() {
  const received: ParsedMail[] = [];
  let reject = false;
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, _session, callback) {
      if (reject) {
        stream.resume();
        stream.on("end", () => callback(Object.assign(new Error("Buzón no disponible"), { responseCode: 550 })));
        return;
      }
      simpleParser(stream, { keepCidLinks: true })
        .then((mail) => {
          received.push(mail);
          callback();
        })
        .catch(callback);
    },
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.server.address() as AddressInfo).port;
  return {
    port,
    received,
    setReject: (v: boolean) => (reject = v),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
