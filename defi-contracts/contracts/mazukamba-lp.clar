;; contracts/mazukamba-lp.clar
(define-fungible-token mazukamba-lp)

(define-constant err-minter-only (err u300))
(define-constant err-amount-zero (err u301))

(define-data-var allowed-minter principal tx-sender)

(define-read-only (get-total-supply)
  (ft-get-supply mazukamba-lp)
)

(define-read-only (get-decimals) 
  (ok u6)
)

(define-read-only (get-symbol)
  (ok "MAZU-LP")
)

;; Change the minter to any other principal, can only be called the current minter
(define-public (set-minter (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get allowed-minter)) err-minter-only)
    ;; who is unchecked, we allow the minter to make whoever they like the new minter
    ;; #[allow(unchecked_data)]
    (ok (var-set allowed-minter who))
  )
)

;; Custom function to mint tokens, only available to our exchange
(define-public (mint (amount uint) (who principal))
  (begin
    (asserts! (is-eq tx-sender (var-get allowed-minter)) err-minter-only)
    (asserts! (> amount u0) err-amount-zero)
    ;; amount, who are unchecked, but we let the contract owner mint to whoever they like for convenience
    ;; #[allow(unchecked_data)]
    (ft-mint? mazukamba-lp amount who)
  )
)

(define-public (burn (amount uint))
  (ft-burn? mazukamba-lp amount tx-sender)
)