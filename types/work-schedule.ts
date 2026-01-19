export interface WorkScheduleRecord {
  id: string
  fields: {
    [key: string]: any
    fldT720jVmGMXFURUKL?: string // תאריך
    fldqFE8SRWBvx3lhI33?: string // התייצבות
    fldMONOIhazLclMi3WN?: string // תיאור
    fldiIu1Wm6gC2665QdN?: string // חזור
    fldjMfOvWEu7HtjSQmv?: boolean // שלח
    fldoOFQdbIVJthTngkg?: boolean // מאושר
    fldpPsdEQlpmh7UtZ0G?: number // מחיר לקוח+ מע"מ
    fldF2pbjDa4PjHtm0bP?: number // מחיר לקוח כולל מע"מ
    fldcSKtFOjZMDyWHALR?: number // מע"מ
    fldJrzZk9KXj8bn5Rrl?: number // מחיר נהג+ מע"מ
    fldhBH2HAFeNviGwRlu?: number // מחיר נהג כולל מע"מ
    fldWeK6U7xPnkEFCOgx?: string // הערות לנהג
    fldjh2IDuPaJMXIpbpg?: string // הערות מנהל
    fldwiQrnnM5roYUmSOd?: string // שם מזמין
    fldBvclPS0jDWOMtSed?: number // טלפון נייד
    fldBgekMAmJGCJ74xTH?: number // ת"ז
    fldKhk7JWpnlquyHQ4l?: any // שם לקוח (link)
    fldeppUjfYTJgZZi6VI?: any // סוג רכב (link)
    fldGTTvqQ8lii1wfiS5?: any // שם נהג (link)
  }
  createdTime?: string
  lastModifiedTime?: string
}

export interface TableSchema {
  id: string
  name: string
  fields: Array<{
    id: string
    name: string
    type: string
    cellValueType: string
    isComputed?: boolean
    options?: any
  }>
}
