import axios, {  AxiosResponse } from "axios"
import { BlockAPIResponse } from "../types/blockType"
import { calcTransactionEnergy } from "../energy/energyUtils"
import { DayBlockAPIResponse } from "../types/dayType"
import { WalletAPIResponse } from "../types/walletType"
import { getTime} from 'date-fns'


const blockchainAPI = {
    fetchBlock: (blockId: string) => {
        const url = `https://blockchain.info/rawblock/${blockId}`
        return  axios.get<BlockAPIResponse>(url)
    },

    getTransactionsFromDataBlock: (dataBlock: AxiosResponse<BlockAPIResponse>) =>{
        if(dataBlock.status<400)
            return dataBlock.data.tx.map(calcTransactionEnergy)
        else    
            return null
    },

    fetchDayBlocks: async(day: Date) => {
        const millis = getTime(day)
        const url = `https://blockchain.info/blocks/${millis}?format=json`

        const response = await axios.get<DayBlockAPIResponse[]>(url)
        return response.data
    },

    fetchWallet: (address: string) =>{
        const url = `https://blockchain.info/rawaddr/${address}`
        return axios.get<WalletAPIResponse>(url)
    }
}

export default blockchainAPI


