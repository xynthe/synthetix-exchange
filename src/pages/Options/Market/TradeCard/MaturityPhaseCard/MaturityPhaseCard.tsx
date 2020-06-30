import React, { FC, memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, ConnectedProps } from 'react-redux';
import styled from 'styled-components';

import { OptionsMarketInfo, AccountMarketInfo } from 'pages/Options/types';
import { RootState } from 'ducks/types';
import { getIsLoggedIn } from 'ducks/wallet/walletDetails';

import Card from 'components/Card';
import NetworkFees from 'pages/Options/components/NetworkFees';

import snxJSConnector from 'utils/snxJSConnector';
import { normalizeGasLimit } from 'utils/transactions';
import { useBOMContractContext } from '../../contexts/BOMContractContext';

import { ReactComponent as FinishIcon } from 'assets/images/finish.svg';

import { headingH4CSS, headingH6CSS } from 'components/Typography/Heading';
import { formatCurrencyWithSign } from 'utils/formatters';

import {
	StyledTimeRemaining,
	CardContent,
	ActionButton,
	StyledCardHeader,
	StyledCardBody,
	PhaseEnd,
} from '../common';
import ResultCard from '../components/ResultCard';
import { USD_SIGN, SYNTHS_MAP } from 'constants/currency';

const mapStateToProps = (state: RootState) => ({
	isLoggedIn: getIsLoggedIn(state),
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type MaturityPhaseCardProps = PropsFromRedux & {
	optionsMarket: OptionsMarketInfo;
	accountMarketInfo: AccountMarketInfo;
};

const MaturityPhaseCard: FC<MaturityPhaseCardProps> = memo(
	({ optionsMarket, isLoggedIn, accountMarketInfo }) => {
		const { t } = useTranslation();
		const BOMContract = useBOMContractContext();

		const [isExercising, setIsExercising] = useState<boolean>(false);
		const [gasLimit, setGasLimit] = useState<number | null>(null);

		const { bids, claimable } = accountMarketInfo;
		const nothingToExercise = !claimable.short && !claimable.long;

		const buttonDisabled = isExercising || !isLoggedIn || nothingToExercise || !gasLimit;

		useEffect(() => {
			const fetchGasLimit = async () => {
				if (!isLoggedIn) return;
				try {
					const BOMContractWithSigner = BOMContract.connect((snxJSConnector as any).signer);
					const gasEstimate = await BOMContractWithSigner.estimate.exerciseOptions();
					setGasLimit(normalizeGasLimit(Number(gasEstimate)));
				} catch (e) {
					console.log(e);
					setGasLimit(null);
				}
			};
			fetchGasLimit();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [isLoggedIn]);

		const handleExercise = async () => {
			try {
				setIsExercising(true);
				const BOMContractWithSigner = BOMContract.connect((snxJSConnector as any).signer);
				await BOMContractWithSigner.exerciseOptions();
				setIsExercising(false);
			} catch (e) {
				console.log(e);
				setIsExercising(false);
			}
		};

		return (
			<Card>
				<StyledCardHeader>{t('options.market.trade-card.maturity.title')}</StyledCardHeader>
				<StyledCardBody>
					<StyledResultCard
						icon={<FinishIcon />}
						title={t('options.market.trade-card.maturity.card-title')}
						subTitle={t('options.market.trade-card.maturity.card-subtitle')}
						longAmount={bids.long}
						shortAmount={bids.short}
						result={optionsMarket.result}
					/>
					<Payout>
						<PayoutTitle>{t('options.market.trade-card.maturity.payout-amount')}</PayoutTitle>
						<PayoutAmount>
							{formatCurrencyWithSign(USD_SIGN, claimable[optionsMarket.result])} {SYNTHS_MAP.sUSD}
						</PayoutAmount>
					</Payout>
					<StyledCardContent>
						<NetworkFees gasLimit={gasLimit} />
						<ActionButton
							size="lg"
							palette="primary"
							disabled={buttonDisabled}
							onClick={handleExercise}
						>
							{nothingToExercise
								? t('options.market.trade-card.maturity.confirm-button.success-label')
								: !isExercising
								? t('options.market.trade-card.maturity.confirm-button.label')
								: t('options.market.trade-card.maturity.confirm-button.progress-label')}
						</ActionButton>
						<PhaseEnd>
							{t('options.market.trade-card.maturity.footer.end-label')}{' '}
							<StyledTimeRemaining end={optionsMarket.timeRemaining} />
						</PhaseEnd>
					</StyledCardContent>
				</StyledCardBody>
			</Card>
		);
	}
);

const StyledResultCard = styled(ResultCard)`
	margin-bottom: 21px;
`;

const Payout = styled.div`
	padding-bottom: 22px;
	text-align: center;
`;

const PayoutTitle = styled.div`
	${headingH6CSS};
	text-transform: uppercase;
	color: ${(props) => props.theme.colors.fontTertiary};
	padding-bottom: 3px;
`;

const PayoutAmount = styled.div`
	${headingH4CSS};
	color: ${(props) => props.theme.colors.fontPrimary};
`;

const StyledCardContent = styled(CardContent)`
	border-top: 1px solid ${(props) => props.theme.colors.accentL1};
`;

export default connector(MaturityPhaseCard);