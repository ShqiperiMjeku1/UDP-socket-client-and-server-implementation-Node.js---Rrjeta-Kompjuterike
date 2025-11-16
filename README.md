# UDP Socket client and server implementation Node.js – Grupi 33

### Anëtarët e grupit : 
- **Enis Shabani**
- **Lis Spahija**
- **Rinesa Selmonaj**
- **Shqiperi Mjeku**

---

## Përshkrim i projektit

**UDP Socket System** është ndërtuar në Node.js që demonstron komunikimin midis një serveri dhe disa klientëve duke përdorur protokollin **UDP**.  
Serveri përpunon komanda nga klientë të ndryshëm, ndërsa klientët mund të lexojnë, kërkojnë, ngarkojnë apo shkarkojnë fajlla, varësisht nga roli i tyre.

Në fazën fillestare është realizuar komunikimi bazë server–client:

- Dërgimi i komandave
- Përpunimi i tyre në server
- Kthimi i përgjigjeve UDP

Në fazën finale, aplikacioni është zgjeruar me funksione më të avancuara:

1. **Menaxhimi i Klientëve dhe Roleve**
    - Regjistrim automatik i klientëve me `clientId` dhe rol.
    - Role të ndryshme:
        - **Admin** – qasje e plotë (upload, delete, write).
        - **Read-only** – vetëm lexim dhe kërkim.
    - Kufizim i numrit maksimal të klientëve.

2. **Komunikimi përmes Komandave UDP**
    - Komandat e suportuara:
        - `LIST` – Liston fajllat
        - `READ <filename>` – Lexon përmbajtjen e fajllit
        - `UPLOAD <filename> <base64>` – Ngarkon fajll
        - `DOWNLOAD <filename>` – Shkarkon fajll
        - `DELETE <filename>` – Fshin fajll *(admin only)*
        - `SEARCH <keyword>` – Kërkon fajlla sipas fjalës kyçe
        - `INFO <filename>` – Informata teknike për fajllin
        - `MSG <text>` – Mesazh i thjeshtë
    - Format i komunikimit ndërmjet klientit dhe serverit:
      ```
      clientId|role|komanda
      ```

3. **Ruajtja dhe Menaxhimi i File-ve**
    - Folder i dedikuar `shared/` për ruajtjen e fajllave.
    - Shkarkimi ruhet automatikisht te klienti.
    - Mundësi për:
        - Lexim
        - Fshirje (vetëm admin)
        - Ngarkim
        - Kërkim

4. **Statistika & Monitorim i Serverit**
    - Komanda `STATS` shfaq:
        - Klientët aktivë
        - Bytes IN/OUT
        - Mesazhet totale
        - Aktivitetin e secilit klient
    - Statistikë e ruajtur në `server_stats.txt`.

---
