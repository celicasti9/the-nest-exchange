import { useEffect, useState } from "react"
import Auth from "../components/Auth"
import PageHeading from "../components/PageHeading"
import SectionHeading from "../components/SectionHeading"
import SwapForm from "../components/SwapForm"
import fetchExchangeInfo, { ExchangeInfo } from "../lib/fetchExchangeInfo"
import { useStacks } from "../providers/StacksProvider"
import { useTransactionToasts } from "../providers/TransactionToastProvider"
import { appDetails, contractOwnerAddress, exchangeContractName, microstacksPerSTX } from "../lib/constants"
import { createAssetInfo, FungibleConditionCode, makeContractFungiblePostCondition, makeContractSTXPostCondition, makeStandardFungiblePostCondition, makeStandardSTXPostCondition, uintCV } from "@stacks/transactions"
import { ContractCallRegularOptions, openContractCall } from "@stacks/connect"

export default function SwapPage() {
  const { addTransactionToast } = useTransactionToasts()
  const { network, address } = useStacks()
  const [priceSlippage, setPriceSlippage] = useState(5)
  const [exchangeInfo, setExchangeInfo] = useState<ExchangeInfo | undefined>(undefined)

  const exchangeRatio = exchangeInfo && exchangeInfo.stxBalance ? exchangeInfo.tokenBalance / exchangeInfo.stxBalance : undefined

  const fetchExchangeInfoOnLoad = async () => {
    if (!address) {
      console.log("Can't fetch exchange info without sender address")
      return
    }

    const exchangeInfo = await fetchExchangeInfo(network, address)
    setExchangeInfo(exchangeInfo)
  }

  useEffect(() => {
    fetchExchangeInfoOnLoad()
  }, [address])

  const stxToTokenSwap = async (stxAmount: number) => {
    if (!address || !exchangeInfo || !exchangeRatio) {
      console.error("Address and exchange info are required for stxToTokenSwap")
      return
    }

    const microstacks = stxAmount * microstacksPerSTX;

    const stxPostCondition = makeStandardSTXPostCondition(
      address,
      FungibleConditionCode.Equal,
      microstacks
    )

    const minimumExchangeRateMultiple = 1 - (priceSlippage / 100)
    const minimumExchangeRate = exchangeRatio * minimumExchangeRateMultiple
    const minimumTokens = (stxAmount * minimumExchangeRate).toFixed(0)

    const tokenPostCondition = makeContractFungiblePostCondition(
      contractOwnerAddress,
      exchangeContractName,
      FungibleConditionCode.GreaterEqual,
      minimumTokens,
      createAssetInfo(contractOwnerAddress, 'mazukamba', 'mazukamba')
    )

    const options: ContractCallRegularOptions = {
      contractAddress: contractOwnerAddress,
      contractName: exchangeContractName,
      functionName: 'stx-to-token-swap',
      functionArgs: [
        uintCV(microstacks),
      ],
      postConditions: [stxPostCondition, tokenPostCondition],
      network,
      appDetails,
      onFinish: ({ txId }) => addTransactionToast(txId, `Swapping ${stxAmount} STX...`),
    }

    await openContractCall(options)
  }

  const tokenToStxSwap = async (tokenAmount: number) => {
    if (!address || !exchangeInfo || !exchangeRatio) {
      console.error("Address and exchange info are required for tokenToStxSwap")
      return
    }

    const tokenPostCondition = makeStandardFungiblePostCondition(
      address,
      FungibleConditionCode.Equal,
      tokenAmount,
      createAssetInfo(contractOwnerAddress, 'mazukamba', 'mazukamba')
    )

    const minimumExchangeRateMultiple = 1 - (priceSlippage / 100)
    const inverseExchangeRate = 1 / exchangeRatio
    const minimumExchangeRate = inverseExchangeRate * minimumExchangeRateMultiple
    const minimumStx = (tokenAmount * minimumExchangeRate * microstacksPerSTX).toFixed(0)

    const stxPostCondition = makeContractSTXPostCondition(
      contractOwnerAddress,
      exchangeContractName,
      FungibleConditionCode.GreaterEqual,
      minimumStx,
    )

    const options: ContractCallRegularOptions = {
      contractAddress: contractOwnerAddress,
      contractName: exchangeContractName,
      functionName: 'token-to-stx-swap',
      functionArgs: [
        uintCV(tokenAmount),
      ],
      postConditions: [tokenPostCondition, stxPostCondition],
      network,
      appDetails,
      onFinish: ({ txId }) => addTransactionToast(txId, `Swapping ${tokenAmount} Magic Beans...`),
    }

    await openContractCall(options)
  }

  const makeExchangeRatioSection = () => {
    if (!exchangeInfo) {
      return <p>Fetching exchange data...</p>
    }
    if (!exchangeRatio) {
      return <p>No liquidity yet!</p>
    }

    // toFixed(6) rounds to 6 decimal places, the + removes trailing 0s. Eg. 0.050000 -> 0.05
    return (
      <section>
        <p>1 STX = <b>{+exchangeRatio.toFixed(6)}</b> Mazukamba</p>
        <p>Current balance: <b>{+exchangeInfo.stxBalance.toFixed(6)}</b> STX and <b>{+exchangeInfo.tokenBalance.toFixed(6)}</b> Mazukamba</p>
      </section>
    )
  }

  return (
    <div className="flex flex-col max-w-4xl gap-12 px-8 m-auto">
      <PageHeading>Swap</PageHeading>

      <Auth />

      {makeExchangeRatioSection()}

      <form>
        <label htmlFor="price-slippage">Max Price Slippage: {priceSlippage}%</label>
        <div className="mt-1">
          <input
            type="range"
            min={3}
            max={100}
            step={1}
            id="price-slippage"
            value={priceSlippage}
            onChange={(e) => setPriceSlippage(e.currentTarget.valueAsNumber)}
          />
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section>
          <SectionHeading>Swap STX to Mazukamba</SectionHeading>

          <SwapForm inputCurrency="STX" decimals={6} swapFunction={stxToTokenSwap} />
        </section>

        <section>
          <SectionHeading>Swap Mazukamba to STX</SectionHeading>

          <SwapForm inputCurrency="MAZU" decimals={0} swapFunction={tokenToStxSwap} />
        </section>
      </div>
    </div >
  )
}